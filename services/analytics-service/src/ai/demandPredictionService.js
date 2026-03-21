function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeRegionKey({ lat, lng, precision = 2 }) {
  const safeLat = safeNumber(lat, 0);
  const safeLng = safeNumber(lng, 0);
  return `${safeLat.toFixed(precision)}:${safeLng.toFixed(precision)}`;
}

export function buildDemandSnapshot({
  activeOrders = 0,
  onlineDrivers = 0,
  completedOrdersLastHour = 0,
  cancelledOrdersLastHour = 0,
  avgEtaMinutes = 0,
}) {
  const orders = safeNumber(activeOrders, 0);
  const drivers = safeNumber(onlineDrivers, 0);
  const completed = safeNumber(completedOrdersLastHour, 0);
  const cancelled = safeNumber(cancelledOrdersLastHour, 0);
  const avgEta = safeNumber(avgEtaMinutes, 0);

  const pressure = drivers > 0 ? orders / drivers : orders > 0 ? 2 : 0;
  const completionSignal = completed * 0.6;
  const cancelPenalty = cancelled * 0.35;
  const etaPenalty = avgEta * 0.1;

  const predictedOrders = Math.max(
    0,
    Math.round(orders + completionSignal + pressure * 3 - cancelPenalty + etaPenalty)
  );

  const predictedDriversNeeded = Math.max(
    0,
    Math.ceil(predictedOrders / 2)
  );

  const confidence = Math.max(
    0.35,
    Math.min(0.95, 0.55 + Math.min(pressure, 3) * 0.08)
  );

  return {
    active_orders: orders,
    online_drivers: drivers,
    completed_orders_last_hour: completed,
    cancelled_orders_last_hour: cancelled,
    avg_eta_minutes: avgEta,
    pressure,
    predicted_orders: predictedOrders,
    predicted_drivers_needed: predictedDriversNeeded,
    confidence: Number(confidence.toFixed(4)),
  };
}

export function buildDemandPredictionRecord({
  serviceType = "taxi",
  regionKey,
  predictionWindowMinutes = 30,
  snapshot,
}) {
  return {
    service_type: serviceType,
    region_key: regionKey,
    predicted_orders: snapshot.predicted_orders,
    predicted_drivers_needed: snapshot.predicted_drivers_needed,
    confidence: snapshot.confidence,
    prediction_window_minutes: predictionWindowMinutes,
    source: "heuristic_ai_v1",
  };
}
