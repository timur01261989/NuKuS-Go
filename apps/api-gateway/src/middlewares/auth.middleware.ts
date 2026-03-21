import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    (req as any).user = jwt.verify(token, process.env.JWT_SECRET || "secret");
    next();
  } catch { return res.status(401).json({ error: "Invalid token" }); }
}
