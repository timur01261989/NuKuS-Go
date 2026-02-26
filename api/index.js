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
import authHandler from "../server/api/auth.js";
import driverHandler from "../server/api/driver.js";
import dispatchHandler from "../server/api/dispatch.js";
import billingHandler from "../server/api/billing.js";
import sosHandler from "../server/api/sos.js";
import presenceHandler from "../server/api/presence.js";
import notificationsHandler from "../server/api/notifications.js";
import miscHandler from "../server/api/misc.js";

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

  if (base === "order") return "order";
  if (base === "auth") return "auth";
  if (base === "offer") return "billing-offer";
  if (base === "wallet") return "billing-wallet";
  if (base === "billing") return "billing";
  if (base === "sos") return "sos";
  if (base === "pricing") return "misc-pricing";
  if (base === "gamification") return "misc-gamification";
  if (base === "misc") return "misc";
  if (base === "cron_dispatch") return "dispatch-cron";

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

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    // Vercel rewrite friendly: /api/(.*) -> /api?path=$1
    const queryPath = url.searchParams.get("path");
    const directPath = url.pathname.replace(/^\/api\/?/, "");
    const path = normalizePath(queryPath || directPath);

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

    if (path.startsWith("order")) {
      return await orderHandler(req, res);
    }

    if (path.startsWith("auth")) {
      return await authHandler(req, res);
    }

    if (path.startsWith("driver") || path.startsWith("driver-")) {
      return await driverHandler(req, res, req.routeKey || "driver");
    }

    if (path.startsWith("dispatch") || path.startsWith("cron_dispatch")) {
      req.query = req.query || {};
      req.query.__subpath = path;
      return await dispatchHandler(req, res);
    }

    if (path.startsWith("presence")) {
      return await presenceHandler(req, res);
    }

    if (path.startsWith("cron_dispatch")) {
      return await cronDispatchHandler(req, res);
    }
    if (path.startsWith("offer") || path.startsWith("wallet") || path.startsWith("billing")) {
      req.query = req.query || {};
      req.query.__subpath = path;
      return await billingHandler(req, res);
    }

    if (path.startsWith("sos")) {
      return await sosHandler(req, res);
    }

    if (path.startsWith("notifications")) {
      return await notificationsHandler(req, res);
    }
    if (path.startsWith("gamification") || path.startsWith("pricing") || path.startsWith("misc")) {
      req.query = req.query || {};
      req.query.__subpath = path;
      return await miscHandler(req, res);
    }

    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "API route topilmadi", path }));
  } catch (e) {
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
