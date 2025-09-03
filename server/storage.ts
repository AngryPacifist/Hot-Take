import {
  users,
  categories,
  predictions,
  votes,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Prediction,
  type InsertPrediction,
  type Vote,
  type InsertVote,
  type PredictionWithDetails,
  type RegisterData,
  type UserProfile,
  passwordResetTokens,
  type PasswordResetToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations 
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: RegisterData & { password: string }): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Prediction operations
  getPredictions(limit?: number, offset?: number, categoryId?: string, sortBy?: "recent" | "trending" | "ending_soon", searchQuery?: string): Promise<PredictionWithDetails[]>;
  getPrediction(id: string): Promise<PredictionWithDetails | undefined>;
  createPrediction(prediction: InsertPrediction & { userId: string }): Promise<Prediction>;
  updatePredictionStats(predictionId: string): Promise<void>;
  
  // Vote operations
  getUserVote(userId: string, predictionId: string): Promise<Vote | undefined>;
  createVote(vote: InsertVote & { userId: string }): Promise<Vote>;
  
  // User stats
  updateUserStats(userId: string): Promise<void>;
  getLeaderboard(limit?: number, offset?: number): Promise<User[]>;
  getUserProfile(userId: string): Promise<User | undefined>;

  // Password reset
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: RegisterData & { password: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Prediction operations
  async getPredictions(limit = 20, offset = 0, categoryId?: string, sortBy: "recent" | "trending" | "ending_soon" = "trending", searchQuery?: string): Promise<PredictionWithDetails[]> {
    const whereClauses = and(
      categoryId ? eq(predictions.categoryId, categoryId) : undefined,
      searchQuery ? sql`(${predictions.title} ILIKE ${'%' + searchQuery + '%'} OR ${predictions.description} ILIKE ${'%' + searchQuery + '%'})` : undefined
    );

    let query = db
      .select({
        prediction: predictions,
        user: users,
        category: categories,
      })
      .from(predictions)
      .leftJoin(users, eq(predictions.userId, users.id))
      .leftJoin(categories, eq(predictions.categoryId, categories.id))
      .where(whereClauses);

    if (sortBy === "recent") {
      query = query.orderBy(desc(predictions.createdAt));
    } else if (sortBy === "trending") {
      query = query.orderBy(sql`("total_stakes" + "yes_votes" + "no_votes") DESC`);
    } else if (sortBy === "ending_soon") {
      query = query.orderBy(predictions.resolutionDate);
    } else {
      query = query.orderBy(desc(predictions.createdAt));
    }

    const results = await query.limit(limit).offset(offset);
    
    return results.map((result: { prediction: Prediction, user: User, category: Category }) => {
      const prediction = result.prediction;
      const totalVotes = prediction.yesVotes + prediction.noVotes;
      const yesPercentage = totalVotes > 0 ? Math.round((prediction.yesVotes / totalVotes) * 100) : 0;
      const noPercentage = 100 - yesPercentage;
      
      const now = new Date();
      const timeLeft = new Date(prediction.resolutionDate).getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
      const timeRemaining = daysLeft > 0 ? `${daysLeft}d` : 'Ended';

      return {
        ...prediction,
        user: result.user!,
        category: result.category!,
        yesPercentage,
        noPercentage,
        timeRemaining,
      } as PredictionWithDetails;
    });
  }

  async getPrediction(id: string): Promise<PredictionWithDetails | undefined> {
    const [result] = await db
      .select({
        prediction: predictions,
        user: users,
        category: categories,
      })
      .from(predictions)
      .leftJoin(users, eq(predictions.userId, users.id))
      .leftJoin(categories, eq(predictions.categoryId, categories.id))
      .where(eq(predictions.id, id));

    if (!result) return undefined;

    const prediction = result.prediction;
    const totalVotes = prediction.yesVotes + prediction.noVotes;
    const yesPercentage = totalVotes > 0 ? Math.round((prediction.yesVotes / totalVotes) * 100) : 0;
    const noPercentage = 100 - yesPercentage;
    
    const now = new Date();
    const timeLeft = new Date(prediction.resolutionDate).getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
    const timeRemaining = daysLeft > 0 ? `${daysLeft}d` : 'Ended';

    return {
      ...prediction,
      user: result.user!,
      category: result.category!,
      yesPercentage,
      noPercentage,
      timeRemaining,
    } as PredictionWithDetails;
  }

  async createPrediction(prediction: InsertPrediction & { userId: string }): Promise<Prediction> {
    const [newPrediction] = await db.insert(predictions).values(prediction).returning();
    return newPrediction;
  }

  async updatePredictionStats(predictionId: string): Promise<void> {
    const voteStats = await db
      .select({
        totalStakes: sql<number>`count(*)`.mapWith(Number),
        totalPoints: sql<number>`sum(${votes.pointsStaked})`.mapWith(Number),
        yesVotes: sql<number>`sum(case when ${votes.stance} = true then 1 else 0 end)`.mapWith(Number),
        noVotes: sql<number>`sum(case when ${votes.stance} = false then 1 else 0 end)`.mapWith(Number),
        yesPoints: sql<number>`sum(case when ${votes.stance} = true then ${votes.pointsStaked} else 0 end)`.mapWith(Number),
        noPoints: sql<number>`sum(case when ${votes.stance} = false then ${votes.pointsStaked} else 0 end)`.mapWith(Number),
      })
      .from(votes)
      .where(eq(votes.predictionId, predictionId));

    const stats = voteStats[0];
    if (stats) {
      await db
        .update(predictions)
        .set({
          totalStakes: stats.totalStakes || 0,
          totalPoints: stats.totalPoints || 0,
          yesVotes: stats.yesVotes || 0,
          noVotes: stats.noVotes || 0,
          yesPoints: stats.yesPoints || 0,
          noPoints: stats.noPoints || 0,
          updatedAt: new Date(),
        })
        .where(eq(predictions.id, predictionId));
    }
  }

  // Vote operations
  async getUserVote(userId: string, predictionId: string): Promise<Vote | undefined> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(and(eq(votes.userId, userId), eq(votes.predictionId, predictionId)));
    return vote;
  }

  async createVote(vote: InsertVote & { userId: string }): Promise<Vote> {
    const [newVote] = await db.insert(votes).values(vote).returning();
    
    // Update prediction stats
    await this.updatePredictionStats(vote.predictionId);
    
    // Update user points
    await db
      .update(users)
      .set({
        points: sql`${users.points} - ${vote.pointsStaked}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, vote.userId));

    return newVote;
  }

  // User stats
  async updateUserStats(userId: string): Promise<void> {
    const userStats = await db
      .select({
        totalPredictions: sql<number>`count(distinct ${predictions.id})`.mapWith(Number),
        totalVotes: sql<number>`count(distinct ${votes.id})`.mapWith(Number),
      })
      .from(users)
      .leftJoin(predictions, eq(predictions.userId, userId))
      .leftJoin(votes, eq(votes.userId, userId))
      .where(eq(users.id, userId));

    const stats = userStats[0];
    if (stats) {
      await db
        .update(users)
        .set({
          totalPredictions: stats.totalPredictions || 0,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  }

  async getLeaderboard(limit = 50, offset = 0): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.points), desc(users.accuracyScore))
      .limit(limit)
      .offset(offset);
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return undefined;
    }

    const userPredictionsData = await db
      .select({
        prediction: predictions,
        user: users,
        category: categories,
      })
      .from(predictions)
      .leftJoin(users, eq(predictions.userId, users.id))
      .leftJoin(categories, eq(predictions.categoryId, categories.id))
      .where(eq(predictions.userId, userId))
      .orderBy(desc(predictions.createdAt));

    const userPredictions = userPredictionsData.map((result: { prediction: Prediction, user: User, category: Category }) => {
      const p = result.prediction;
      const totalVotes = p.yesVotes + p.noVotes;
      const yesPercentage = totalVotes > 0 ? Math.round((p.yesVotes / totalVotes) * 100) : 0;
      const noPercentage = 100 - yesPercentage;
      const now = new Date();
      const timeLeft = new Date(p.resolutionDate).getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
      const timeRemaining = daysLeft > 0 ? `${daysLeft}d` : "Ended";
      return {
        ...p,
        user: result.user!,
        category: result.category!,
        yesPercentage,
        noPercentage,
        timeRemaining,
      };
    });

    const userVotesData = await db
      .select({
        vote: votes,
        prediction: predictions,
      })
      .from(votes)
      .leftJoin(predictions, eq(votes.predictionId, predictions.id))
      .where(eq(votes.userId, userId))
      .orderBy(desc(votes.createdAt));

    const votesWithPrediction = userVotesData
      .filter((r: { vote: Vote, prediction: Prediction | null }): r is { vote: Vote; prediction: Prediction } => r.prediction !== null)
      .map(({ vote, prediction }: { vote: Vote, prediction: Prediction }) => ({
        ...vote,
        prediction: prediction,
      }));

    return {
      ...user,
      predictions: userPredictions,
      votes: votesWithPrediction,
    };
  }

  // Password reset token operations
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [row] = await db
      .insert(passwordResetTokens)
      .values({ token, userId, expiresAt })
      .returning();
    return row;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [row] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return row;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token));
  }
}

export const storage = new DatabaseStorage();
