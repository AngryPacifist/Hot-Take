import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword, comparePassword, loginUser, logoutUser } from "./auth";
import { insertPredictionSchema, insertVoteSchema, loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize default categories
  const defaultCategories = [
    { name: "Tech", emoji: "🚀", color: "bg-blue-100 text-blue-800" },
    { name: "Sports", emoji: "⚽", color: "bg-green-100 text-green-800" },
    { name: "Crypto", emoji: "💰", color: "bg-yellow-100 text-yellow-800" },
    { name: "Memes", emoji: "😂", color: "bg-pink-100 text-pink-800" },
    { name: "Food", emoji: "🍕", color: "bg-orange-100 text-orange-800" },
  ];

  // Ensure default categories exist
  for (const category of defaultCategories) {
    try {
      await storage.createCategory(category);
    } catch (error) {
      // Category might already exist, ignore error
    }
  }

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
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

      // Verify password
      const isValid = await comparePassword(validatedData.password, user.password);
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

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.session as any).userId;
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
  app.get("/api/predictions", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const categoryId = req.query.categoryId as string;
      
      const predictions = await storage.getPredictions(limit, offset, categoryId);
      
      // If user is authenticated, include their votes
      if (req.isAuthenticated?.() && req.user) {
        const userId = (req.user as any).claims.sub;
        for (const prediction of predictions) {
          const userVote = await storage.getUserVote(userId, prediction.id);
          if (userVote) {
            (prediction as any).userVote = userVote;
          }
        }
      }
      
      res.json(predictions);
    } catch (error) {
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
      if (req.isAuthenticated?.() && req.user) {
        const userId = (req.user as any).claims.sub;
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

  app.post("/api/predictions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertPredictionSchema.parse(req.body);
      
      const prediction = await storage.createPrediction({
        ...validatedData,
        userId,
      });
      
      res.status(201).json(prediction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prediction data", errors: error.errors });
      }
      console.error("Error creating prediction:", error);
      res.status(500).json({ message: "Failed to create prediction" });
    }
  });

  // Vote routes
  app.post("/api/votes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertVoteSchema.parse(req.body);
      
      // Check if user already voted on this prediction
      const existingVote = await storage.getUserVote(userId, validatedData.predictionId);
      if (existingVote) {
        return res.status(400).json({ message: "You have already voted on this prediction" });
      }

      // Check if user has enough points
      const user = await storage.getUser(userId);
      if (!user || user.points < validatedData.pointsStaked) {
        return res.status(400).json({ message: "Insufficient points" });
      }
      
      const vote = await storage.createVote({
        ...validatedData,
        userId,
      });
      
      // Broadcast vote update via WebSocket
      if (wss) {
        const message = JSON.stringify({
          type: 'vote_update',
          predictionId: validatedData.predictionId,
          vote: vote,
        });
        
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
      
      res.status(201).json(vote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      }
      console.error("Error creating vote:", error);
      res.status(500).json({ message: "Failed to create vote" });
    }
  });

  // User routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const users = await storage.getLeaderboard(limit);
      res.json(users);
    } catch (error) {
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
