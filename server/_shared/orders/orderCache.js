const CACHE_TTL_MS = 5000;
const cache = new Map();

export function cacheOrder(order) {
  if (!order?.id) return order;
  cache.set(String(order.id), { value: order, ts: Date.now() });
  return order;
}

export function getCachedOrder(orderId) {
  const key = String(orderId || '').trim();
  if (!key) return null;
  const row = cache.get(key);
  if (!row) return null;
  if ((Date.now() - row.ts) > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return row.value;
}

export function invalidateOrderCache(orderId) {
  const key = String(orderId || '').trim();
  if (key) cache.delete(key);
}
