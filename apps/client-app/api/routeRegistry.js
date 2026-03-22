import orderHandler from "../server/api/order.js";
import orderStatusHandler from "../server/api/order_status.js";
import authHandler from "../server/api/auth.js";
import driverHandler from "../server/api/driver.js";
import dispatchHandler from "../server/api/dispatch.js";
import dispatchArchitectureHandler from "../server/api/dispatch_architecture.js";
import dispatchEnqueueHandler from "../server/api/dispatch_enqueue.js";
import dispatchPredictionsHandler from "../server/api/dispatch_predictions.js";
import cityDispatchHandler from "../server/api/city_dispatch.js";
import eventStreamHandler from "../server/api/event_stream.js";
import offerHandler from "../server/api/offer.js";
import walletHandler from "../server/api/wallet.js";
import sosHandler from "../server/api/sos.js";
import presenceHandler from "../server/api/presence.js";
import clientLocationHandler from "../server/api/client_location.js";
import cronDispatchHandler from "../server/api/cron_dispatch.js";
import notificationsHandler from "../server/api/notifications.js";
import gamificationHandler from "../server/api/gamification.js";
import pricingHandler from "../server/api/pricing.js";
import pricingDynamicHandler from "../server/api/pricing_dynamic.js";
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
import intercityHandler from "../server/api/intercity.js";
import analyticsHandler from "../server/api/analytics.js";
// FIX: push.js va push_register.js bir xil mantiqni takrorlagan edi (DOCX: push endpoint contract nomosligi).
// push.js route "push" ga qo'yilgan, lekin o'zining kommentida POST /api/push/register deydi.
// Klient src/native/push.js: "send token to server: /api/push/register" — bu to'g'ri endpoint.
// Yechim: pushHandler (push.js) ni olib tashlash, "push" route ni ham push_register ga yo'naltirish.
import pushRegisterHandler from "../server/api/push_register.js";
import pushSendHandler from "../server/api/push_send.js";
import healthHandler from "../server/api/health.js";
import observabilityHandler from "../server/api/observability.js";
import partnersHandler from "../server/api/partners.js";
import settlementHandler from "../server/api/settlement.js";
import fleetHandler from "../server/api/fleet.js";

export function normalizePath(rawPath) {
  let p = String(rawPath || "");
  p = p.replace(/^\/+/u, "");
  p = p.split("?")[0].split("#")[0];
  return p;
}

export const ROUTE_REGISTRY = new Map([
  ["order", orderHandler],
  ["order_status", orderStatusHandler],
  ["order-status", orderStatusHandler],
  ["auth", authHandler],
  ["driver", driverHandler],
  ["dispatch", dispatchHandler],
  ["dispatch-enqueue", dispatchEnqueueHandler],
  ["dispatch_enqueue", dispatchEnqueueHandler],
  ["dispatch-predictions", dispatchPredictionsHandler],
  ["dispatch_predictions", dispatchPredictionsHandler],
  ["dispatch-architecture", dispatchArchitectureHandler],
  ["dispatch_architecture", dispatchArchitectureHandler],
  ["city-dispatch", cityDispatchHandler],
  ["city_dispatch", cityDispatchHandler],
  ["event-stream", eventStreamHandler],
  ["event_stream", eventStreamHandler],
  ["offer", offerHandler],
  ["wallet", walletHandler],
  ["sos", sosHandler],
  ["presence", presenceHandler],
  ["client_location", clientLocationHandler],
  ["client-location", clientLocationHandler],
  ["cron-dispatch", cronDispatchHandler],
  ["cron_dispatch", cronDispatchHandler],
  ["notifications", notificationsHandler],
  ["gamification", gamificationHandler],
  ["pricing", pricingHandler],
  ["pricing-dynamic", pricingDynamicHandler],
  ["pricing_dynamic", pricingDynamicHandler],
  ["freight", freightHandler],
  ["cron-heatmap", cronHeatmapHandler],
  ["cron_heatmap", cronHeatmapHandler],
  ["fraud", fraudHandler],
  ["support", supportHandler],
  ["voip", voipHandler],
  ["auto-market", autoMarketHandler],
  ["auto_market", autoMarketHandler],
  ["promo", promoHandler],
  ["referral", referralHandler],
  ["reward-worker", rewardWorkerHandler],
  ["reward_worker", rewardWorkerHandler],
  ["delivery", deliveryHandler],
  ["payments", paymentsHandler],
  ["intercity", intercityHandler],
  ["analytics", analyticsHandler],
  // FIX: "push" → push_register handler (avval push.js edi — noto'g'ri duplicate)
  ["push", pushRegisterHandler],
  ["push/register", pushRegisterHandler],
  ["push_register", pushRegisterHandler],
  ["push/send", pushSendHandler],
  ["push_send", pushSendHandler],
  ["health", healthHandler],
  ["observability", observabilityHandler],
  ["partners", partnersHandler],
  ["settlement", settlementHandler],
  ["fleet", fleetHandler],
  ["dispatch-match", dispatchHandler],
  ["dispatch_match", dispatchHandler],
  ["driver_heartbeat", driverHandler],
  ["driver-heartbeat", driverHandler],
]);

export function resolveRouteHandler(path) {
  const normalized = normalizePath(path);

  if (ROUTE_REGISTRY.has(normalized)) {
    return ROUTE_REGISTRY.get(normalized);
  }

  const rootSegment = normalized.split("/")[0];
  if (ROUTE_REGISTRY.has(rootSegment)) {
    return ROUTE_REGISTRY.get(rootSegment);
  }

  if (normalized.startsWith("auto-market/") || normalized.startsWith("auto_market/")) {
    return autoMarketHandler;
  }

  return null;
}
