/**
 * Performance Library — Hot Path Optimizations
 * Based on document recommendations:
 * - Object pooling (zero GC pressure)
 * - For loops instead of map/filter
 * - BRIN index hints
 * - Memory-efficient collections
 */

// ── Object Pool ───────────────────────────────────────────────────────────────
export class ObjectPool<T extends object> {
  private pool:    T[] = [];
  private active:  Set<T> = new Set();
  private factory: () => T;
  private reset:   (obj: T) => void;
  private maxSize: number;
  private created = 0;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 100, maxSize = 10_000) {
    this.factory = factory;
    this.reset   = reset;
    this.maxSize = maxSize;
    // Pre-warm pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    let obj: T;
    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      obj = this.factory();
      this.created++;
    }
    this.active.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (!this.active.has(obj)) return;
    this.active.delete(obj);
    this.reset(obj);
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  get stats() {
    return {
      pooled:  this.pool.length,
      active:  this.active.size,
      created: this.created,
      reuse_rate: this.created > 0 ? 1 - this.pool.length / this.created : 0,
    };
  }
}

// ── Pre-created Object Pools for UniGo ───────────────────────────────────────

export interface LocationPoint {
  lat:       number;
  lng:       number;
  bearing:   number;
  speed:     number;
  timestamp: number;
  driverId:  string;
}

export const locationPool = new ObjectPool<LocationPoint>(
  () => ({ lat: 0, lng: 0, bearing: 0, speed: 0, timestamp: 0, driverId: "" }),
  (obj) => { obj.lat = 0; obj.lng = 0; obj.bearing = 0; obj.speed = 0; obj.timestamp = 0; obj.driverId = ""; },
  1000,   // Pre-warm 1000 objects
  50_000  // Max pool size
);

export interface DispatchJob {
  orderId:     string;
  lat:         number;
  lng:         number;
  serviceType: string;
  radiusKm:    number;
  attempt:     number;
  createdAt:   number;
}

export const dispatchJobPool = new ObjectPool<DispatchJob>(
  () => ({ orderId: "", lat: 0, lng: 0, serviceType: "", radiusKm: 5, attempt: 0, createdAt: 0 }),
  (obj) => { obj.orderId = ""; obj.lat = 0; obj.lng = 0; obj.serviceType = ""; obj.attempt = 0; },
  500,
  5_000
);

// ── Fast Array Operations (avoid map/filter in hot paths) ─────────────────────

/** Faster than .filter() — no new array allocation in tight loops */
export function filterInPlace<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  let writeIdx = 0;
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i])) {
      arr[writeIdx++] = arr[i];
    }
  }
  arr.length = writeIdx;
  return arr;
}

/** Faster than .map() for simple transforms */
export function mapInPlace<T>(arr: T[], transform: (item: T, idx: number) => T): T[] {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = transform(arr[i], i);
  }
  return arr;
}

/** Fast sum without .reduce() */
export function fastSum(arr: number[]): number {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i];
  return sum;
}

/** Fast sort for driver candidates by score */
export function sortByScore(drivers: Array<{ smart_score: number }>): typeof drivers {
  // Insertion sort — faster than Array.sort for small arrays (< 50 elements)
  if (drivers.length <= 10) {
    for (let i = 1; i < drivers.length; i++) {
      const key = drivers[i];
      let j = i - 1;
      while (j >= 0 && drivers[j].smart_score < key.smart_score) {
        drivers[j + 1] = drivers[j];
        j--;
      }
      drivers[j + 1] = key;
    }
    return drivers;
  }
  return drivers.sort((a, b) => b.smart_score - a.smart_score);
}

// ── String Interning ─────────────────────────────────────────────────────────
// Reduces memory for repeated strings (service_type, status, etc.)
const stringInterner = new Map<string, string>();

export function intern(str: string): string {
  const existing = stringInterner.get(str);
  if (existing !== undefined) return existing;
  stringInterner.set(str, str);
  return str;
}

export const INTERNED = {
  TAXI:          intern("taxi"),
  DELIVERY:      intern("delivery"),
  FREIGHT:       intern("freight"),
  SEARCHING:     intern("searching"),
  ACCEPTED:      intern("accepted"),
  IN_PROGRESS:   intern("in_progress"),
  COMPLETED:     intern("completed"),
  CANCELLED:     intern("cancelled"),
  ONLINE:        intern("online"),
  OFFLINE:       intern("offline"),
  ON_TRIP:       intern("on_trip"),
};

// ── LRU Cache ────────────────────────────────────────────────────────────────
export class LRUCache<K, V> {
  private cache:    Map<K, V>;
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.cache   = new Map();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first entry)
      this.cache.delete(this.cache.keys().next().value!);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean { return this.cache.has(key); }
  delete(key: K): void { this.cache.delete(key); }
  get size()           { return this.cache.size; }
  clear()              { this.cache.clear(); }
}

// Pre-created LRU caches
export const etaCache          = new LRUCache<string, number>(10_000);
export const surgeCache        = new LRUCache<string, number>(5_000);
export const userProfileCache  = new LRUCache<string, any>(50_000);
export const driverStatusCache = new LRUCache<string, string>(100_000);
