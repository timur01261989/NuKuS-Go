// src/services/supportApi.js
// Safe wrapper for order-linked support chat API (additive).

const API_BASE = ""; // relative to same origin (Vercel)

async function postJson(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const t = await r.text();
  try {
    return JSON.parse(t);
  } catch {
    return { ok: false, error: "Non-JSON response", raw: t };
  }
}

async function getJson(path) {
  const r = await fetch(`${API_BASE}${path}`, { method: "GET" });
  const t = await r.text();
  try {
    return JSON.parse(t);
  } catch {
    return { ok: false, error: "Non-JSON response", raw: t };
  }
}

export async function createOrFindSupportThread(payload) {
  return postJson("/api/support/thread", payload);
}

export async function sendSupportMessage(payload) {
  return postJson("/api/support/message", payload);
}

export async function getSupportThread(thread_id) {
  return getJson(`/api/support/thread?thread_id=${encodeURIComponent(thread_id)}`);
}

export async function listSupportThreads(params = {}) {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qp.set(k, String(v));
  });
  return getJson(`/api/support/list?${qp.toString()}`);
}
