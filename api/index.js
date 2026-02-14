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

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname.replace(/^\/api\/?/, "");

    // normalize
    if (path.startsWith("order")) {
      return await orderHandler(req, res);
    }

    if (path.startsWith("auth")) {
      return await authHandler(req, res);
    }

    if (path.startsWith("driver")) {
      return await driverHandler(req, res);
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
