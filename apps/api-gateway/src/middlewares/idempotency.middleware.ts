import { Request, Response, NextFunction } from "express";
import IORedis from "ioredis";

const redis = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

const IDEMPOTENCY_TTL = 86400; // 24 hours

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["idempotency-key"] as string | undefined;
  if (!key || !["POST", "PUT", "PATCH"].includes(req.method)) return next();

  const cacheKey = `idempotent:${key}`;

  redis.get(cacheKey).then(cached => {
    if (cached) {
      try {
        const { status, body } = JSON.parse(cached);
        res.setHeader("X-Idempotent-Replayed", "true");
        return res.status(status).json(body);
      } catch {
        return next();
      }
    }

    // Intercept response to cache it
    const origJson = res.json.bind(res);
    res.json = function(body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis.setex(cacheKey, IDEMPOTENCY_TTL, JSON.stringify({
          status: res.statusCode, body,
        })).catch(() => null);
      }
      return origJson(body);
    };

    next();
  }).catch(() => next());
}
