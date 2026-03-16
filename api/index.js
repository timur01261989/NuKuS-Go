/**
 * api/index.js
 * Universal router for compact API structure (Vercel-friendly)
 * Routes all /api/* requests to corresponding module
 *
 * FIXES:
 *  - Robust request body parsing for Vercel single-function router (req.body was often undefined)
 *  - Keeps backward compatibility with existing handlers (order/auth/driver/dispatch/...)
 */

import orderHandler from "../server/api/order.js";
import orderStatusHandler from "../server/api/order_status.js";
import authHandler from "../server/api/auth.js";
import driverHandler from "../server/api/driver.js";
import dispatchHandler from "../server/api/dispatch.js";
import offerHandler from "../server/api/offer.js";
import walletHandler from "../server/api/wallet.js";
import sosHandler from "../server/api/sos.js";
import presenceHandler from "../server/api/presence.js";
import cronDispatchHandler from "../server/api/cron_dispatch.js";
import notificationsHandler from "../server/api/notifications.js";
import gamificationHandler from "../server/api/gamification.js";
import pricingHandler from "../server/api/pricing.js";
import freightHandler from "../server/api/freight.js";
import cronHeatmapHandler from "../server/api/cron_heatmap.js";
import fraudHandler from "../server/api/fraud.js";
import supportHandler from "../server/api/support.js";
import voipHandler from "../server/api/voip.js";
import autoMarketHandler from "../server/api/auto_market.js";
import promoHandler from "../server/api/promo.js";
import referralHandler from "../server/api/referral.js";
import rewardWorkerHandler from "../server/api/reward_worker.js";
import deliveryHandler from "../server/api/delivery.js";
import paymentsHandler from "../server/api/payments.js";
import { logger } from "../server/_shared/logger.js";

function normalizePath(rawPath) {
  // Supports both direct path (/api/order) and rewritten query (?path=order)
  let p = String(rawPath || "");
  // remove any leading slashes
  p = p.replace(/^\/+/, "");
  // drop any query fragments accidentally passed
  p = p.split("?")[0].split("#")[0];
  return p;
}

function getRouteKey(path) {
  // path is already without leading /api/
  const parts = String(path || "").split("/").filter(Boolean); // ["driver","state"]
  const base = parts[0] || "";
  const sub = parts[1] || "";

  if (base === "driver") {
    // Back-compat endpoints supported:
    // /api/driver/state, /api/driver/location, /api/driver/heartbeat
    // Also accept older names: /api/driver-state etc via base matching below
    const map = {
      "": "driver",
      location: "driver-location",
      state: "driver-state",
      heartbeat: "driver-heartbeat",
    };
    return map[sub] || "driver";
  }

  if (base === "dispatch") {
    // /api/dispatch, /api/dispatch/smart, /api/dispatch/eta, /api/dispatch/traffic, /api/dispatch/heatmap
    const map = {
      "": "dispatch",
      smart: "dispatch-smart",
      eta: "eta",
      traffic: "traffic-eta",
      heatmap: "heatmap",
    };
    return map[sub] || "dispatch";
  }

  if (base === "order-status") return "order-status";
  if (base === "orders") return "order";
  if (base === "order") {
    const map = { "": "order", status: "order-status", phones: "order-phones" };
    return map[sub] || "order";
  }
  if (base === "auth") return "auth";
  if (base === "offer") return "offer";
  if (base === "wallet-balance") return "wallet";
  if (base === "wallet-transactions") return "wallet-transactions";
  if (base === "wallet-topup-demo") return "wallet-topup-demo";
  if (base === "wallet") {
    const map = {
      "": "wallet",
      balance: "wallet",
      transactions: "wallet-transactions",
      topup: "wallet-topup-demo",
    };
    return map[sub] || "wallet";
  }
  if (base === "support") {
    const map = { "": "support", thread: "support-thread", message: "support-message", list: "support-list" };
    return map[sub] || "support";
  }
  if (base === "voip") {
    const map = { "": "voip", start: "voip-start", end: "voip-end", log: "voip-log" };
    return map[sub] || "voip";
  }

  if (base === "sos") return "sos";

  if (base === "auto-market" || base === "automarket" || base === "market-auto") {
    // /api/auto-market/payment/create
    const map = {
      "": "auto-market",
      payment: "auto-market-payment",
      promo: "auto-market-promo",
      contact: "auto-market-contact",
      cron: "auto-market-cron",
    };
    return map[sub] || "auto-market";
  }

  // Older flat paths still used by frontend in a few places:
  if (base === "driver-state") return "driver-state";
  if (base === "driver-location") return "driver-location";
  if (base === "driver-heartbeat") return "driver-heartbeat";

  return "";
}

function readStream(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
    // Safety: in case the platform doesn't emit properly
    req.on("aborted", () => reject(new Error("Request aborted")));
  });
}

function parseBodyFromBuffer(buf, contentType) {
  const ct = String(contentType || "").toLowerCase();

  if (!buf || buf.length === 0) return undefined;

  const text = buf.toString("utf-8");

  if (ct.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      // Keep raw text if JSON parse fails
      return text;
    }
  }

  if (ct.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(text);
    const obj = {};
    for (const [k, v] of params.entries()) obj[k] = v;
    return obj;
  }

  // multipart/form-data: do not parse here (handlers should handle it if needed)
  // default: return raw text
  return text;
}

async function ensureParsedBody(req) {
  // If some runtime already parsed it (e.g., Next.js pages/api), keep it.
  if (req.body !== undefined && req.body !== null) return req.body;

  // Avoid parsing twice
  if (req.__bodyParsed) return req.body;

  req.__bodyParsed = true;

  const method = String(req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return undefined;

  const contentType = req.headers?.["content-type"] || "";

  // Read raw stream (Vercel single function often gives raw IncomingMessage with no body parsing)
  const raw = await readStream(req);
  req.rawBody = raw;

  const parsed = parseBodyFromBuffer(raw, contentType);
  req.body = parsed;
  return parsed;
}


function createRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export default async function handler(req, res) {
  try {
    req.requestId = req.headers?.["x-request-id"] || req.headers?.["X-Request-Id"] || createRequestId();
    res.setHeader("X-Request-Id", req.requestId);
    const url = new URL(req.url, "http://localhost");
    // Vercel rewrite friendly: /api/(.*) -> /api?path=$1
    const queryPath = url.searchParams.get("path");
    const directPath = url.pathname.replace(/^\/api\/?/, "");
    const path = normalizePath(queryPath || directPath);

    logger.info("api_request_started", { requestId: req.requestId, method: req.method, url: req.url });
    // Basic CORS (safe default). Adjust origins if you want stricter policy.
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }

    // Ensure body parsing ONCE for all downstream handlers
    // (This is the key fix when using a single /api entrypoint on Vercel)
    await ensureParsedBody(req);

    // routeKey for subroutes (used by dispatch/driver modules)
    req.routeKey = getRouteKey(path);

    if (path.startsWith("order/status")) {
      return await orderStatusHandler(req, res);
    }

    if (path.startsWith("order")) {
      return await orderHandler(req, res);
    }

    if (path.startsWith("auth")) {
      return await authHandler(req, res);
    }

    if (path.startsWith("driver") || path.startsWith("driver-")) {
      return await driverHandler(req, res, req.routeKey || "driver");
    }

    if (path.startsWith("dispatch")) {
      return await dispatchHandler(req, res);
    }

    if (path.startsWith("presence")) {
      return await presenceHandler(req, res);
    }

    if (path.startsWith("cron_heatmap")) {
      return await cronHeatmapHandler(req, res);
    }

    if (path.startsWith("cron_dispatch")) {
      return await cronDispatchHandler(req, res);
    }

    if (path.startsWith("offer")) {
      return await offerHandler(req, res);
    }

    if (path.startsWith("payments") || path.startsWith("order-pay-wallet") || path.startsWith("order-complete")) {
      return await paymentsHandler(req, res);
    }

    if (path.startsWith("wallet")) {
      return await walletHandler(req, res);
    }

    if (path.startsWith("sos")) {
      return await sosHandler(req, res);
    }

    if (path.startsWith("notifications")) {
      return await notificationsHandler(req, res);
    }

    if (path.startsWith("gamification")) {
      return await gamificationHandler(req, res);
    }

    if (path.startsWith("pricing")) {
      return await pricingHandler(req, res);
    }

    if (path.startsWith("fraud")) {
      return await fraudHandler(req, res);
    }

    if (path.startsWith("support")) {
      return await supportHandler(req, res);
    }

    if (path.startsWith("voip")) {
      return await voipHandler(req, res);
    }


    if (path.startsWith("promo-validate")) {
      return await promoHandler(req, res);
    }

    if (path.startsWith("order-apply-promo")) {
      return await paymentsHandler(req, res);
    }

    if (path.startsWith("delivery")) {
      return await deliveryHandler(req, res);
    }

    if (path.startsWith("referral")) {
      return await referralHandler(req, res);
    }

    if (path.startsWith("reward-worker") || path.startsWith("reward_worker")) {
      return await rewardWorkerHandler(req, res);
    }

    if (path.startsWith("auto-market") || path.startsWith("automarket") || path.startsWith("market-auto")) {
      return await autoMarketHandler(req, res);
    }

    if (path.startsWith("freight")) {
      return await freightHandler(req, res);
    }

    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "API route topilmadi", path }));
  } catch (e) {
    logger.error("api_request_failed", { requestId: req.requestId, method: req.method, url: req.url, message: e?.message });
    const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production";
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: e?.message || "Server error",
        name: isProd ? undefined : e?.name,
        // stack can help you debug on Vercel logs; keep it hidden for clients in production.
        stack: isProd ? undefined : e?.stack,
      })
    );
  }
}
