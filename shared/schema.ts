import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  points: integer("points").default(1000).notNull(),
  accuracyScore: decimal("accuracy_score", { precision: 5, scale: 2 }).default('0.00'),
  totalPredictions: integer("total_predictions").default(0).notNull(),
  correctPredictions: integer("correct_predictions").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  emoji: varchar("emoji").notNull(),
  color: varchar("color").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const predictions = pgTable("predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  categoryId: varchar("category_id").references(() => categories.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  resolutionDate: timestamp("resolution_date").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedValue: boolean("resolved_value"),
  totalStakes: integer("total_stakes").default(0).notNull(),
  totalPoints: integer("total_points").default(0).notNull(),
  yesVotes: integer("yes_votes").default(0).notNull(),
  noVotes: integer("no_votes").default(0).notNull(),
  yesPoints: integer("yes_points").default(0).notNull(),
  noPoints: integer("no_points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  predictionId: varchar("prediction_id").references(() => predictions.id).notNull(),
  stance: boolean("stance").notNull(), // true for yes, false for no
  pointsStaked: integer("points_staked").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  token: varchar("token").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  predictions: many(predictions),
  votes: many(votes),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  predictions: many(predictions),
}));

export const predictionsRelations = relations(predictions, ({ one, many }) => ({
  user: one(users, {
    fields: [predictions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [predictions.categoryId],
    references: [categories.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  prediction: one(predictions, {
    fields: [votes.predictionId],
    references: [predictions.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email").optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  userId: true, // Added by middleware
  totalStakes: true,
  totalPoints: true,
  yesVotes: true,
  noVotes: true,
  yesPoints: true,
  noPoints: true,
  resolved: true,
  resolvedValue: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  resolutionDate: z.string().transform((val) => new Date(val)),
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  userId: true, // Added by middleware
  createdAt: true,
});

// Password reset schemas
export const createPasswordResetRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateUserProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters").optional(),
  profileImageUrl: z.string().url("Invalid URL").optional(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;

export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Extended types with relations
export type PredictionWithDetails = Prediction & {
  user: User;
  category: Category;
  userVote?: Vote;
  yesPercentage: number;
  noPercentage: number;
  timeRemaining: string;
};

export type VoteWithPrediction = Vote & {
  prediction: Prediction;
};

export type UserProfile = User & {
  predictions: PredictionWithDetails[];
  votes: VoteWithPrediction[];
};
