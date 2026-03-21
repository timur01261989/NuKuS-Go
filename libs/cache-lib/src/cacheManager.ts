import { l1 } from "./l1.cache";
import { l2 } from "./l2.cache";

export interface CacheTTL {
  l1Ms:      number; // milliseconds (in-memory)
  l2Seconds: number; // seconds (Redis)
}

export const TTL_PRESETS: Record<string, CacheTTL> = {
  USER_SESSION:    { l1Ms: 60_000,    l2Seconds: 86_400 },  // 1min / 24h
  DRIVER_LOCATION: { l1Ms: 5_000,     l2Seconds: 30 },       // 5s / 30s
  TARIFF_CONFIG:   { l1Ms: 300_000,   l2Seconds: 3_600 },    // 5min / 1h
  ORDER_STATUS:    { l1Ms: 2_000,     l2Seconds: 30 },        // 2s / 30s
  SURGE_ZONE:      { l1Ms: 10_000,    l2Seconds: 60 },        // 10s / 60s
  SEARCH_RESULT:   { l1Ms: 30_000,    l2Seconds: 300 },       // 30s / 5min
  STATIC_DATA:     { l1Ms: 600_000,   l2Seconds: 86_400 },   // 10min / 24h
};

/**
 * Read-through cache: L1 → L2 → loader
 */
export async function cached<T>(
  key:    string,
  loader: () => Promise<T>,
  ttl:    CacheTTL = TTL_PRESETS.STATIC_DATA
): Promise<T> {
  // Check L1
  const fromL1 = l1.get<T>(key);
  if (fromL1 !== undefined) return fromL1;

  // Check L2
  const fromL2 = await l2.get<T>(key);
  if (fromL2 !== null) {
    l1.set(key, fromL2, ttl.l1Ms);
    return fromL2;
  }

  // Load from source
  const value = await loader();

  // Write back to both layers
  l1.set(key, value, ttl.l1Ms);
  await l2.set(key, value, ttl.l2Seconds);

  return value;
}

export async function invalidate(key: string): Promise<void> {
  l1.delete(key);
  await l2.del(key);
}

export async function invalidatePattern(pattern: string): Promise<void> {
  await l2.invalidatePattern(pattern);
}
