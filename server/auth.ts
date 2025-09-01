import bcrypt from "bcryptjs";
import type { RequestHandler } from "express";

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.session && (req.session as any).userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function loginUser(req: any, userData: any) {
  (req.session as any).userId = userData.id;
  (req.session as any).user = userData;
}

export async function logoutUser(req: any) {
  return new Promise<void>((resolve, reject) => {
    req.session.destroy((err: any) => {
      if (err) reject(err);
      else resolve();
    });
  });
}