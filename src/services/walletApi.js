const API_BASE = (import.meta?.env?.VITE_API_BASE || '').replace(/\/$/, '');

async function getJson(path) {
  const r = await fetch(`${API_BASE}${path}`);
  const j = await r.json().catch(()=>({}));
  if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}

async function postJson(path, body) {
  const r = await fetch(`${API_BASE}${path}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body||{}) });
  const j = await r.json().catch(()=>({}));
  if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}

export function getWalletBalance(user_id) {
  return getJson(`/api/wallet-balance?user_id=${encodeURIComponent(user_id)}`);
}

export function demoTopup(user_id, amount_uzs) {
  return postJson('/api/wallet-topup-demo', { user_id, amount_uzs });
}
