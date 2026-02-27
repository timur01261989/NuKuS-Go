
// Location throttle (prevents flooding server/DB when many drivers are online)
const lastLocSent = new Map(); // key -> timestamp ms
const shouldSendLoc = (key, minMs = 6000) => {
  const now = Date.now();
  const last = lastLocSent.get(key) || 0;
  if (now - last < minMs) return false;
  lastLocSent.set(key, now);
  return true;
};

const API_BASE = (import.meta?.env?.VITE_API_BASE || '').replace(/\/$/, '');

async function postJson(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const j = await r.json().catch(()=>({}));
  if (!r.ok || j?.ok === false) {
    const msg = j?.error || `HTTP ${r.status}`;
    throw new Error(msg);
  }
  return j;
}

export async function createOrder({ pickup, dropoff }) {
  return postJson('/api/orders', { pickup, dropoff });
}

export async function updateOrderStatus({ order_id, status, driver_id }) {
  return postJson('/api/order-status', { order_id, status, driver_id });
}

export async function upsertDriverLocation({ order_id, driver_id, lat, lng, bearing, speed }) {
  const key = `${String(driver_id||'')}:${String(order_id||'')}`;
  if (!shouldSendLoc(key, 6000)) {
    return { ok: true, skipped: true };
  }
  return postJson('/api/driver-location', { order_id, driver_id, lat, lng, bearing, speed });
}


export async function estimateEta({ distance_km, speed_kmh }) {
  const qs = new URLSearchParams({ distance_km: String(distance_km ?? 0), speed_kmh: String(speed_kmh ?? 25) });
  const r = await fetch(`${API_BASE}/api/eta?${qs.toString()}`);
  const j = await r.json().catch(()=>({}));
  if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}
