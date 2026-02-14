// api/index.js
// Unified router for Vercel Serverless Functions.
// Backward-compatible route keys are mapped into consolidated modules.

import auth from "./auth.js";
import driver from "./driver.js";
import order from "./order.js";
import dispatch from "./dispatch.js";
import offer from "./offer.js";
import wallet from "./wallet.js";
import sos from "./sos.js";

import { applyCors } from "./_shared/cors.js";

// ---- body reader helper (some runtimes don't populate req.body) ----
async function ensureBody(req) {
  const method = (req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD") return;
  if (req.body != null) return;

  const chunks = [];
  for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  const raw = Buffer.concat(chunks).toString("utf-8");
  req.body = raw;
}

// RouteKey extraction:
// - /api/<routeKey>   (most common)
// - /api?route=<routeKey>
function getRouteKey(req) {
  try {
    const url = new URL(req.url, "http://localhost");
    const q = url.searchParams.get("route");
    if (q) return q;

    const path = url.pathname || "";
    const parts = path.split("/").filter(Boolean);
    // parts like ["api", "order-status"]
    const idx = parts.indexOf("api");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    // fallback: last part
    return parts[parts.length - 1] || "health";
  } catch {
    return "health";
  }
}

// Consolidated mapping (old endpoints preserved)
function resolveModule(routeKey) {
  // AUTH
  if (routeKey === "auth" || routeKey === "auth-otp-request" || routeKey === "auth-otp-verify") {
    return { mod: auth, key: routeKey };
  }

  // DRIVER
  if (routeKey === "driver" || routeKey === "driver-location" || routeKey === "driver-state" || routeKey === "driver-heartbeat") {
    // driver-heartbeat was historically part of driver-state in this codebase
    return { mod: driver, key: routeKey === "driver-heartbeat" ? "driver-state" : routeKey };
  }

  // ORDER
  if (routeKey === "order" || routeKey.startsWith("order-") || routeKey === "promo-validate" || routeKey === "cron-expire-orders" || routeKey === "market-listings") {
    // order-create / order-status / order-complete / order-cancel / order-pay-* / order-apply-promo / promo-validate / cron-expire-orders / market-listings
    return { mod: order, key: routeKey };
  }

  // DISPATCH
  if (routeKey === "dispatch") return { mod: dispatch, key: routeKey };

  // OFFER
  if (routeKey === "offer" || routeKey === "offer-respond") return { mod: offer, key: routeKey === "offer-respond" ? "offer-respond" : routeKey };

  // WALLET
  if (routeKey === "wallet" || routeKey === "wallet-balance") return { mod: wallet, key: routeKey === "wallet-balance" ? "wallet-balance" : routeKey };

  // SOS
  if (routeKey === "sos") return { mod: sos, key: routeKey };

  return null;
}

export default async function handler(req, res) {
  applyCors(req, res);

  // Preflight
  if ((req.method || "GET").toUpperCase() === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  await ensureBody(req);

  const routeKey = getRouteKey(req);
  if (routeKey === "health") {
    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true, service: "api", ts: Date.now() }));
    return;
  }

  const resolved = resolveModule(routeKey);
  if (!resolved) {
    res.statusCode = 404;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: "Unknown route", route: routeKey }));
    return;
  }

  return await resolved.mod(req, res, resolved.key);
}
