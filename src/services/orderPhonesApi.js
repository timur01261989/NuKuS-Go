// src/services/orderPhonesApi.js
// Direct call helper: fetch the other party phone for an order.

async function getJson(path) {
  const res = await fetch(path, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

export async function getOrderOtherPhone({ order_id, requester_id }) {
  const q = new URLSearchParams({ order_id: String(order_id || ''), requester_id: String(requester_id || '') });
  return getJson(`/api/order/phones?${q.toString()}`);
}
