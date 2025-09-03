import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { isAuthenticated, hashPassword, comparePassword, isBcryptHash, loginUser, logoutUser } from "./auth";
import { insertPredictionSchema, insertVoteSchema, loginSchema, registerSchema, createPasswordResetRequestSchema, passwordResetSchema, users, votes } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import type { AuthenticatedRequest } from "./types";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import type { NodePgTransaction } from "drizzle-orm/node-postgres";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        // Return a generic error to prevent user enumeration
        return res.status(409).json({ message: "A user with that name already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });
      
      // Login user
      await loginUser(req, user);
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Verify password. If the stored password isn't a bcrypt hash, treat it
      // as a legacy plaintext and migrate to bcrypt on successful login.
      let isValid = false;
      if (isBcryptHash(user.password)) {
        isValid = await comparePassword(validatedData.password, user.password);
      } else {
        // legacy path: compare plaintext
        isValid = validatedData.password === (user.password as unknown as string);
        if (isValid) {
          // upgrade to bcrypt
          const newHash = await hashPassword(validatedData.password);
          await storage.updateUserPassword(user.id, newHash);
        }
      }

      if (!isValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Login user
      await loginUser(req, user);
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      console.error("Error logging in user:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    try {
      await logoutUser(req);
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error logging out user:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // Password reset: request
  app.post('/api/auth/request-password-reset', async (req, res) => {
    try {
      const { username } = createPasswordResetRequestSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      // Always respond 200 to avoid user enumeration
      if (!user) {
        return res.json({ message: "If that user exists, a reset link has been issued" });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
      await storage.createPasswordResetToken(user.id, token, expiresAt);

      // For now, return token in response (dev). In production, email/DM would be sent.
      res.json({ message: "Reset link created", token, expiresAt });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Failed to request password reset" });
    }
  });

  // Password reset: perform
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = passwordResetSchema.parse(req.body);
      const tokenRow = await storage.getPasswordResetToken(token);
      if (!tokenRow || (tokenRow.usedAt != null) || tokenRow.expiresAt.getTime() < Date.now()) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const newHash = await hashPassword(newPassword);
      await storage.updateUserPassword(tokenRow.userId, newHash);
      await storage.markPasswordResetTokenUsed(token);

      res.json({ message: "Password updated" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Prediction routes
  const getPredictionsSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    offset: z.coerce.number().int().min(0).optional().default(0),
    categoryId: z.string().optional(),
    sortBy: z.enum(["recent", "trending", "ending_soon"]).optional().default("trending"),
    searchQuery: z.string().optional(),
  });

  app.get("/api/predictions", async (req, res) => {
    try {
      const { limit, offset, categoryId, sortBy, searchQuery } = getPredictionsSchema.parse(req.query);

      const predictions = await storage.getPredictions(limit, offset, categoryId, sortBy, searchQuery);
      
      // If user is authenticated, include their votes
      const authReq = req as AuthenticatedRequest;
      if (authReq.session && authReq.session.userId) {
        const userId = authReq.session.userId;
        for (const prediction of predictions) {
          const userVote = await storage.getUserVote(userId, prediction.id);
          if (userVote) {
            (prediction as any).userVote = userVote;
          }
        }
      }
      
      res.json(predictions);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      }
      console.error("Error fetching predictions:", error);
      res.status(500).json({ message: "Failed to fetch predictions" });
    }
  });

  app.get("/api/predictions/:id", async (req, res) => {
    try {
      const prediction = await storage.getPrediction(req.params.id);
      if (!prediction) {
        return res.status(404).json({ message: "Prediction not found" });
      }

      // If user is authenticated, include their vote
      const authReq = req as AuthenticatedRequest;
      if (authReq.session && authReq.session.userId) {
        const userId = authReq.session.userId;
        const userVote = await storage.getUserVote(userId, prediction.id);
        if (userVote) {
          (prediction as any).userVote = userVote;
        }
      }

      res.json(prediction);
    } catch (error) {
      console.error("Error fetching prediction:", error);
      res.status(500).json({ message: "Failed to fetch prediction" });
    }
  });

  app.post("/api/predictions", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validatedData = insertPredictionSchema.parse(req.body);
      
      const prediction = await storage.createPrediction({
        ...validatedData,
        userId,
      });

      // Update user's total predictions count
      await storage.updateUserStats(userId);
      
      res.status(201).json(prediction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prediction data", errors: error.errors });
      }
      console.error("Error creating prediction:", error);
      res.status(500).json({ message: "Failed to create prediction" });
    }
  });

  const resolvePredictionSchema = z.object({
    resolvedValue: z.boolean(),
  });

  app.post("/api/predictions/:id/resolve", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const predictionId = req.params.id;
      const { resolvedValue } = resolvePredictionSchema.parse(req.body);

      const updatedPrediction = await storage.resolvePrediction(predictionId, userId, resolvedValue);

      res.json(updatedPrediction);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }

      const messages = [
        "Prediction not found",
        "You are not authorized to resolve this prediction",
        "Prediction has already been resolved",
        "Resolution time has not passed yet"
      ];
      if (messages.includes(error.message)) {
        return res.status(400).json({ message: error.message });
      }

      console.error("Error resolving prediction:", error);
      res.status(500).json({ message: "Failed to resolve prediction" });
    }
  });

  // Vote routes
  app.post("/api/votes", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validatedData = insertVoteSchema.parse(req.body);

      // @ts-ignore
      const vote = await db.transaction(async (tx) => {
        // Check if user already voted
        const existingVote = await storage.getUserVote(userId, validatedData.predictionId);
        if (existingVote) {
          throw new Error("You have already voted on this prediction");
        }

        // Get user and check points
        const [user] = await tx.select().from(users).where(eq(users.id, userId));
        if (!user || user.points < validatedData.pointsStaked) {
          throw new Error("Insufficient points");
        }

        // Create vote
        const [newVote] = await tx.insert(votes).values({ ...validatedData, userId }).returning();

        // Update user points
        await tx.update(users).set({
          points: sql`${users.points} - ${validatedData.pointsStaked}`
        }).where(eq(users.id, userId));

        // Update prediction stats
        await storage.updatePredictionStats(validatedData.predictionId);

        // Update user stats
        await storage.updateUserStats(userId);

        const updatedPrediction = await storage.getPrediction(validatedData.predictionId);

        return { newVote, updatedPrediction };
      });
      
      // Broadcast vote update via WebSocket
      if (wss) {
        const message = JSON.stringify({
          type: 'vote_update',
          predictionId: validatedData.predictionId,
          prediction: vote.updatedPrediction,
        });
        
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
      
      res.status(201).json(vote);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      }

      const messages = ["Insufficient points", "You have already voted on this prediction"];
      if (messages.includes(error.message)) {
        return res.status(400).json({ message: error.message });
      }

      console.error("Error creating vote:", error);
      res.status(500).json({ message: "Failed to create vote" });
    }
  });

  // User routes
  const getLeaderboardSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    offset: z.coerce.number().int().min(0).optional().default(0),
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const { limit, offset } = getLeaderboardSchema.parse(req.query);
      const users = await storage.getLeaderboard(limit, offset);
      res.json(users);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      }
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUserProfile(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
