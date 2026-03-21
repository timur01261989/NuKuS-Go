const locks = new Map();

export function buildOrderLockKey({ userId, pickup, serviceType = 'taxi' }) {
  const lat = pickup?.lat != null ? Number(pickup.lat).toFixed(5) : '0';
  const lng = pickup?.lng != null ? Number(pickup.lng).toFixed(5) : '0';
  return `${String(userId || 'guest')}::${serviceType}::${lat},${lng}`;
}

export function acquireOrderLock(key, ttlMs = 5000) {
  const safeKey = String(key || '').trim();
  if (!safeKey) return false;
  if (locks.has(safeKey)) return false;
  const timeout = setTimeout(() => locks.delete(safeKey), Math.max(1000, Number(ttlMs) || 5000));
  locks.set(safeKey, timeout);
  return true;
}

export function releaseOrderLock(key) {
  const safeKey = String(key || '').trim();
  const timeout = locks.get(safeKey);
  if (timeout) clearTimeout(timeout);
  locks.delete(safeKey);
}
