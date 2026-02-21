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

export async function updateOrderStatus({ order_id, status, driver_user_id }) {
  return postJson('/api/order-status', { order_id, status, driver_user_id });
}

export async function upsertDriverLocation({ order_id, driver_user_id, lat, lng, bearing, speed }) {
  return postJson('/api/driver-location', { order_id, driver_user_id, lat, lng, bearing, speed });
}


export async function estimateEta({ distance_km, speed_kmh }) {
  const qs = new URLSearchParams({ distance_km: String(distance_km ?? 0), speed_kmh: String(speed_kmh ?? 25) });
  const r = await fetch(`${API_BASE}/api/eta?${qs.toString()}`);
  const j = await r.json().catch(()=>({}));
  if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}
