import { Request, Response, NextFunction } from "express";
export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const t = Date.now();
  res.on("finish", () => console.warn(`[GW] ${req.method} ${req.path} ${res.statusCode} ${Date.now()-t}ms`));
  next();
}
