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

// --- CORS SOZLAMALARI (Frontend ulanishi uchun shart) ---
function setCorsHeaders(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Yoki aniq domen: 'https://sizning-sayt.uz'
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
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
  // 1. CORS headerlarini o'rnatish
  setCorsHeaders(req, res);

  // 2. OPTIONS so'roviga darhol javob berish (Preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const url = new URL(req.url, "http://localhost");
    // /api/ ni olib tashlash va toza path olish
    const path = url.pathname.replace(/^\/api\/?/, "");

    // routeKey for subroutes (used by dispatch/driver modules)
    req.routeKey = getRouteKey(path);

    // --- ROUTING LOGIC ---

    if (path.startsWith("order")) {
      return await orderHandler(req, res);
    }

    if (path.startsWith("auth")) {
      return await authHandler(req, res);
    }

    if (path.startsWith("driver") || path.startsWith("driver-")) {
      // Driver handler routeKey ni kutadi
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

    // Agar hech qaysi route tushmasa
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "API route topilmadi", path: path }));

  } catch (e) {
    console.error("API Router Error:", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ 
      error: e?.message || "Server error", 
      hint: "Check server logs for import errors" 
    }));
  }
}