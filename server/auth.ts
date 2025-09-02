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

// Detect whether a string looks like a bcrypt hash
export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
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