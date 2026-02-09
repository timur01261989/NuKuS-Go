const API_BASE = (import.meta?.env?.VITE_API_BASE || '').replace(/\/$/, '');

async function postJson(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const j = await r.json().catch(()=>({}));
  if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}

export async function sendMessage({ order_id, sender_user_id, body }) {
  return postJson('/api/messages', { order_id, sender_user_id, body });
}

export async function sos({ order_id, user_id, message, lat, lng }) {
  return postJson('/api/sos', { order_id, user_id, message, lat, lng });
}
