import crypto from "crypto";

/** Apply CORS headers. */
export function applyCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/** JSON response helper */
export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function badRequest(res, msg = "Bad Request", extra = {}) {
  return json(res, 400, { ok: false, error: msg, ...extra });
}

export function serverError(res, err) {
  return json(res, 500, { ok: false, error: "Server error", details: String(err?.message || err) });
}

export function nowIso() { return new Date().toISOString(); }

export function uid(prefix = "id") {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}_${Date.now()}`;
}

export function isPhone(s) {
  const t = String(s || "").trim();
  return /^\+?\d{7,15}$/.test(t);
}

export function clampInt(v, min, max, def) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

// In-memory store (demo). Replace with Supabase/Postgres for production.
const memory = globalThis.__NUKUSGO_STORE__ || (globalThis.__NUKUSGO_STORE__ = {
  listings: [],
  orders: [],
  driver_locations: {},
});

export function store() { return memory; }

// Basic rate-limit (memory, per instance)
const rate = globalThis.__NUKUSGO_RATE__ || (globalThis.__NUKUSGO_RATE__ = new Map());
export function hit(key, minIntervalMs = 800) {
  const now = Date.now();
  const last = rate.get(key) || 0;
  if (now - last < minIntervalMs) return false;
  rate.set(key, now);
  return true;
}
