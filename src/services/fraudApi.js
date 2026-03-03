// src/services/fraudApi.js
// Safe wrapper for fraud flags API (additive).
const API_BASE = "";

async function getJson(path) {
  const r = await fetch(`${API_BASE}${path}`, { method: "GET" });
  const t = await r.text();
  try {
    return JSON.parse(t);
  } catch {
    return { ok: false, error: "Non-JSON response", raw: t };
  }
}

export async function listFraudFlags(params = {}) {
  const qp = new URLSearchParams({ action: "list" });
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qp.set(k, String(v));
  });
  return getJson(`/api/fraud?${qp.toString()}`);
}
