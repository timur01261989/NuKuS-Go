/**
 * api/index.js
 * Universal router for compact API structure
 * Routes all /api/* requests to corresponding module
 */

import orderHandler from "./order.js";
import authHandler from "./auth.js";
import driverHandler from "./driver.js";
import dispatchHandler from "./dispatch.js";
import offerHandler from "./offer.js";
import walletHandler from "./wallet.js";
import sosHandler from "./sos.js";

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
    const path = url.pathname.replace(/^\/api\/?/, "");

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

    if (path.startsWith("offer")) {
      return await offerHandler(req, res);
    }

    if (path.startsWith("wallet")) {
      return await walletHandler(req, res);
    }

    if (path.startsWith("sos")) {
      return await sosHandler(req, res);
    }

    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "API route topilmadi" }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: e?.message || "Server error" }));
  }
}
