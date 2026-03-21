import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
export function tracingMiddleware(req: Request, res: Response, next: NextFunction) {
  const id = req.headers["x-trace-id"] as string || uuidv4();
  req.headers["x-trace-id"] = id;
  res.setHeader("x-trace-id", id);
  next();
}
