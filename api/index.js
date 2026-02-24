/**
 * api/index.js
 * Universal router for compact API structure
 * Routes all /api/* requests to corresponding module
 */

import orderHandler from "../server/api/order.js";
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
      "location": "driver-location",
      "state": "driver-state",
      "heartbeat": "driver-heartbeat",
    };
    return map[sub] || "driver";
  }

  if (base === "dispatch") {
    // /api/dispatch, /api/dispatch/smart, /api/dispatch/eta, /api/dispatch/traffic, /api/dispatch/heatmap
    const map = {
      "": "dispatch",
      "smart": "dispatch-smart",
      "eta": "eta",
      "traffic": "traffic-eta",
      "heatmap": "heatmap",
    };
    return map[sub] || "dispatch";
  }

  if (base === "order") return "order";
  if (base === "auth") return "auth";
  if (base === "offer") return "offer";
  if (base === "wallet") return "wallet";
  if (base === "sos") return "sos";

  // Older flat paths still used by frontend in a few places:
  if (base === "driver-state") return "driver-state";
  if (base === "driver-location") return "driver-location";
  if (base === "driver-heartbeat") return "driver-heartbeat";

  return "";
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

    if (path.startsWith("dispatch")) {
      return await dispatchHandler(req, res);
    }

    if (path.startsWith("presence")) {
      return await presenceHandler(req, res);
    }

    if (path.startsWith("cron_dispatch")) {
      return await cronDispatchHandler(req, res);
    }

    if (path.startsWith("offer")) {
      return await offerHandler(req, res);
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

    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "API route topilmadi" }));
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
