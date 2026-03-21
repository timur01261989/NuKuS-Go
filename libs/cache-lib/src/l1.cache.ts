/**
 * L1 Cache — In-process LRU memory cache (sub-millisecond)
 * Per Node.js instance, NOT shared across pods
 */

interface CacheEntry<T> { value: T; expires: number; }

export class L1Cache {
  private store = new Map<string, CacheEntry<any>>();
  private readonly maxSize: number;

  constructor(maxSize = 10_000) {
    this.maxSize = maxSize;
    // Periodic cleanup every 60s
    setInterval(() => this.evictExpired(), 60_000);
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) { this.store.delete(key); return undefined; }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxSize) this.evictOldest();
    this.store.set(key, { value, expires: Date.now() + ttlMs });
  }

  delete(key: string): void { this.store.delete(key); }
  clear(): void { this.store.clear(); }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expires) { this.store.delete(key); return false; }
    return true;
  }

  get size() { return this.store.size; }

  private evictExpired(): void {
    const now = Date.now();
    for (const [k, v] of this.store) {
      if (now > v.expires) this.store.delete(k);
    }
  }

  private evictOldest(): void {
    const first = this.store.keys().next().value;
    if (first) this.store.delete(first);
  }
}

export const l1 = new L1Cache(10_000);
