/**
 * L2 Cache — Redis Cluster (5ms latency, shared across pods)
 */
import Redis from "ioredis";

const redis = new Redis({
  host:     process.env.REDIS_HOST     || "localhost",
  port:     Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect:      true,
  maxRetriesPerRequest: 3,
  enableOfflineQueue:   false,
});

redis.on("error", err => console.error("[l2-cache] Redis error:", err.message));

export const l2 = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!keys.length) return [];
    const vals = await redis.mget(...keys);
    return vals.map(v => v ? JSON.parse(v) as T : null);
  },

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  },
};
