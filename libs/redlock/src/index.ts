/**
 * Redlock — Distributed Locking via Redis
 * Prevents double-booking, double-payment, race conditions
 *
 * Based on Martin Kleppmann's analysis of Redlock algorithm.
 * Uses multiple Redis instances for fault tolerance.
 */

import IORedis from "ioredis";

export interface LockOptions {
  ttlMs:       number;   // Lock TTL in milliseconds
  retries:     number;   // Max acquisition attempts
  retryDelayMs:number;   // Delay between retries
  retryJitter: number;   // Random jitter (0-1)
}

export interface Lock {
  resource: string;
  value:    string;
  ttlMs:    number;
  acquired: Date;
}

const DEFAULT_OPTIONS: LockOptions = {
  ttlMs:       5000,   // 5 seconds
  retries:     3,
  retryDelayMs:200,
  retryJitter: 0.2,
};

const LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

const EXTEND_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("PEXPIRE", KEYS[1], ARGV[2])
else
  return 0
end
`;

export class Redlock {
  private clients: IORedis[];
  private quorum:  number;

  constructor(redisUrls?: string[]) {
    const urls = redisUrls || [
      `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`,
    ];
    this.clients = urls.map(url => new IORedis(url, {
      enableOfflineQueue:   false,
      maxRetriesPerRequest: 1,
      lazyConnect:          true,
    }));
    this.quorum = Math.floor(this.clients.length / 2) + 1;
  }

  /**
   * Acquire a distributed lock
   * @param resource  Lock key (e.g., "order:lock:ORDER_ID")
   * @param options   Lock configuration
   * @returns Lock object if acquired, null if failed
   */
  async acquire(resource: string, options?: Partial<LockOptions>): Promise<Lock | null> {
    const opts  = { ...DEFAULT_OPTIONS, ...options };
    const value = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    for (let attempt = 0; attempt <= opts.retries; attempt++) {
      if (attempt > 0) {
        const jitter = opts.retryDelayMs * opts.retryJitter * Math.random();
        await this._sleep(opts.retryDelayMs + jitter);
      }

      const start    = Date.now();
      let acquiredOn = 0;

      await Promise.all(
        this.clients.map(async client => {
          const result = await client.set(resource, value, "NX", "PX", opts.ttlMs).catch(() => null);
          if (result === "OK") acquiredOn++;
        })
      );

      const elapsed   = Date.now() - start;
      const validity  = opts.ttlMs - elapsed;

      if (acquiredOn >= this.quorum && validity > 0) {
        return { resource, value, ttlMs: validity, acquired: new Date() };
      }

      // Failed — release any partial locks
      await this._releaseLocks(resource, value);
    }

    return null;
  }

  /**
   * Release a previously acquired lock
   */
  async release(lock: Lock): Promise<boolean> {
    const released = await this._releaseLocks(lock.resource, lock.value);
    return released >= this.quorum;
  }

  /**
   * Extend lock TTL
   */
  async extend(lock: Lock, ttlMs: number): Promise<Lock | null> {
    let extended = 0;
    await Promise.all(
      this.clients.map(async client => {
        const result = await client.eval(EXTEND_SCRIPT, 1, lock.resource, lock.value, ttlMs).catch(() => 0);
        if (result === 1) extended++;
      })
    );
    if (extended >= this.quorum) {
      return { ...lock, ttlMs, acquired: new Date() };
    }
    return null;
  }

  /**
   * Execute function with distributed lock — auto-release on completion
   */
  async using<T>(
    resource: string,
    fn:       (lock: Lock) => Promise<T>,
    options?: Partial<LockOptions>
  ): Promise<T> {
    const lock = await this.acquire(resource, options);
    if (!lock) throw new Error(`Could not acquire lock: ${resource}`);

    try {
      return await fn(lock);
    } finally {
      await this.release(lock).catch(() => null);
    }
  }

  private async _releaseLocks(resource: string, value: string): Promise<number> {
    let released = 0;
    await Promise.all(
      this.clients.map(async client => {
        const result = await client.eval(LOCK_SCRIPT, 1, resource, value).catch(() => 0);
        if (result === 1) released++;
      })
    );
    return released;
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ── Singleton instance ───────────────────────────────────────────────────────
export const redlock = new Redlock();

// ── Lock Key Helpers ─────────────────────────────────────────────────────────
export const LockKeys = {
  order:       (orderId: string)   => `lock:order:${orderId}`,
  payment:     (orderId: string)   => `lock:payment:${orderId}`,
  wallet:      (userId: string)    => `lock:wallet:${userId}`,
  dispatch:    (orderId: string)   => `lock:dispatch:${orderId}`,
  driverAccept:(driverId: string)  => `lock:driver:accept:${driverId}`,
  promo:       (code: string, userId: string) => `lock:promo:${code}:${userId}`,
};

// ── Claim Order (the critical double-booking prevention) ─────────────────────
/**
 * Atomically claim an order for a driver.
 * Returns true only if THIS driver successfully claimed it.
 * All other drivers trying simultaneously will get false.
 */
export async function claimOrder(
  orderId:  string,
  driverId: string,
  ttlMs:    number = 10_000
): Promise<boolean> {
  const redis = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: 1,
  });

  try {
    // SET order:{orderId}:claimed {driverId} NX PX {ttl}
    const result = await redis.set(
      `order:${orderId}:claimed`,
      driverId,
      "NX",    // Only if Not eXists
      "PX",    // TTL in ms
      ttlMs
    );
    return result === "OK";
  } finally {
    redis.disconnect();
  }
}

/**
 * Release order claim (driver rejected or order cancelled)
 */
export async function releaseOrderClaim(orderId: string, driverId: string): Promise<boolean> {
  const redis = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: 1,
  });
  try {
    const result = await redis.eval(
      LOCK_SCRIPT, 1,
      `order:${orderId}:claimed`,
      driverId
    );
    return result === 1;
  } finally {
    redis.disconnect();
  }
}
