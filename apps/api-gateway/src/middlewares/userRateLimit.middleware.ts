import { Request, Response, NextFunction } from "express";
import IORedis from "ioredis";

const redis = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

interface RateLimitConfig {
  windowSec:  number;
  maxRequests: number;
}

const LIMITS: Record<string, RateLimitConfig> = {
  "/api/v1/ride":         { windowSec: 60,  maxRequests: 10  },
  "/api/v1/auth":         { windowSec: 60,  maxRequests: 20  },
  "/api/v1/payment":      { windowSec: 60,  maxRequests: 5   },
  "/api/v1/search":       { windowSec: 60,  maxRequests: 100 },
  "/api/v1/ml":           { windowSec: 60,  maxRequests: 30  },
  default:                { windowSec: 60,  maxRequests: 200 },
};

function getConfig(path: string): RateLimitConfig {
  for (const [prefix, cfg] of Object.entries(LIMITS)) {
    if (prefix !== "default" && path.startsWith(prefix)) return cfg;
  }
  return LIMITS.default;
}

export function userRateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.sub;
  const identifier = userId || req.ip || "anonymous";
  const config = getConfig(req.path);
  const key = `ratelimit:user:${identifier}:${req.path.split("/").slice(0, 4).join("/")}`;

  redis.multi()
    .incr(key)
    .expire(key, config.windowSec)
    .exec()
    .then(results => {
      const count = results?.[0]?.[1] as number || 1;
      res.setHeader("X-RateLimit-Limit",     config.maxRequests);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, config.maxRequests - count));
      if (count > config.maxRequests) {
        return res.status(429).json({
          error:       "Too many requests",
          retry_after: config.windowSec,
          limit:       config.maxRequests,
        });
      }
      next();
    })
    .catch(() => next()); // Redis down → allow through
}
