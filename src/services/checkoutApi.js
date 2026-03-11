const API_BASE = (import.meta?.env?.VITE_API_BASE || '').replace(/\/$/, '');

async function postJson(path, body) {
  const r = await fetch(`${API_BASE}${path}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body||{}) });
  const j = await r.json().catch(()=>({}));
  if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}

export function applyPromoToOrder({ order_id, user_id, code, order_total_uzs }) {
  return postJson('/api/order-apply-promo', { order_id, user_id, code, order_total_uzs });
}

export function payOrderWithWallet({ order_id, user_id, amount_uzs }) {
  return postJson('/api/order-pay-wallet', { order_id, user_id, amount_uzs });
}

export function completeOrder({ order_id, user_id, client_id, driver_id, final_price_uzs, service_type }) {
  const canonicalUserId = user_id || client_id || null;
  return postJson('/api/order-complete', {
    order_id,
    user_id: canonicalUserId,
    client_id: canonicalUserId,
    driver_id,
    final_price_uzs,
    service_type,
  });
}
