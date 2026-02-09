// api/index.js

import orders from "../handlers/orders.js";
import orderStatus from "../handlers/order-status.js";
import notify from "../handlers/notify.js";

import walletTopupDemo from "../handlers/wallet-topup-demo.js";
import walletBalance from "../handlers/wallet-balance.js";

import trafficEta from "../handlers/traffic-eta.js";
import sos from "../handlers/sos.js";
import promoValidate from "../handlers/promo-validate.js";

import orderPayWallet from "../handlers/order-pay-wallet.js";
import orderPayComplete from "../handlers/order-pay-complete.js";
import orderCancel from "../handlers/order-cancel.js";
import orderComplete from "../handlers/order-complete.js";
import orderApplyPromo from "../handlers/order-apply-promo.js";

import offerTimeout from "../handlers/offer-timeout.js";
import offerRespond from "../handlers/offer-respond.js";

import notificationsRead from "../handlers/notifications-read.js";
import messages from "../handlers/messages.js";

import marketListings from "../handlers/market-listings.js";
import heatmap from "../handlers/heatmap.js";
import eta from "../handlers/eta.js";

import driverState from "../handlers/driver-state.js";
import driverLocation from "../handlers/driver-location.js";
import driverHeartbeat from "../handlers/driver-heartbeat.js";

import dispatchSmart from "../handlers/dispatch-smart.js";
import dispatch from "../handlers/dispatch.js";

import cronExpireOrders from "../handlers/cron-expire-orders.js";
import cashbackCalc from "../handlers/cashback-calc.js";

import authOtpVerify from "../handlers/auth-otp-verify.js";
import authOtpRequest from "../handlers/auth-otp-request.js";

// ---- body o‘qib beradigan helper (handlerlaring req.body string bo‘lishini kutyapti) ----
async function ensureBody(req) {
  const method = (req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD") return;

  // Agar Vercel req.body ni o‘zi to‘ldirmagan bo‘lsa, streamdan o‘qib qo‘yamiz
  if (req.body !== undefined && req.body !== null) return;

  const raw = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

  req.body = raw;
}

function getOriginalUrl(req) {
  // rewrite bo‘lganda original url header orqali kelishi mumkin
  const h = req.headers || {};
  return h["x-vercel-original-url"] || req.url || "/api";
}

export default async function handler(req, res) {
  try {
    await ensureBody(req);

    const originalUrl = getOriginalUrl(req);
    const url = new URL(originalUrl, "http://localhost");
    const path = url.pathname; // masalan: /api/orders yoki /api/order-status

    // CORS (kerak bo‘lsa)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") return res.status(200).end();

    // /api dan keyingi routeKey ni olamiz
    // /api/orders/create bo‘lsa routeKey = "orders"
    const parts = path.split("/").filter(Boolean); // ["api","orders","create"]
    const routeKey = parts[1] || ""; // "orders"

    const routes = {
      "orders": orders,
      "order-status": orderStatus,
      "notify": notify,

      "wallet-topup-demo": walletTopupDemo,
      "wallet-balance": walletBalance,

      "traffic-eta": trafficEta,
      "sos": sos,
      "promo-validate": promoValidate,

      "order-pay-wallet": orderPayWallet,
      "order-pay-complete": orderPayComplete,
      "order-cancel": orderCancel,
      "order-complete": orderComplete,
      "order-apply-promo": orderApplyPromo,

      "offer-timeout": offerTimeout,
      "offer-respond": offerRespond,

      "notifications-read": notificationsRead,
      "messages": messages,

      "market-listings": marketListings,
      "heatmap": heatmap,
      "eta": eta,

      "driver-state": driverState,
      "driver-location": driverLocation,
      "driver-heartbeat": driverHeartbeat,

      "dispatch-smart": dispatchSmart,
      "dispatch": dispatch,

      "cron-expire-orders": cronExpireOrders,
      "cashback-calc": cashbackCalc,

      "auth-otp-verify": authOtpVerify,
      "auth-otp-request": authOtpRequest
    };

    // Agar /api ning o‘zi chaqirilsa
    if (!routeKey) {
      return res.status(200).json({ ok: true, message: "API router ishlayapti", routes: Object.keys(routes) });
    }

    const fn = routes[routeKey];
    if (!fn) {
      return res.status(404).json({ ok: false, error: "Route topilmadi", routeKey, path });
    }

    // Handlerlaring default export function(req,res) — shuni chaqiramiz
    return await fn(req, res);
  } catch (e) {
    console.error("API ROUTER ERROR:", e);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
