import {
  buildDemandPredictionRecord,
  buildDemandSnapshot,
  normalizeRegionKey,
} from "../ai/demandPredictionService.js";

function getOrderLatLng(order) {
  const pickup = order?.pickup || {};
  return {
    lat: order?.pickup_lat ?? pickup.lat ?? null,
    lng: order?.pickup_lng ?? pickup.lng ?? null,
  };
}

export async function snapshotDemandPrediction({
  supabase,
  order,
  serviceType = "taxi",
  activeOrders = 0,
  onlineDrivers = 0,
  completedOrdersLastHour = 0,
  cancelledOrdersLastHour = 0,
  avgEtaMinutes = 0,
}) {
  if (!supabase || !order?.id) {
    throw new Error("invalid_demand_prediction_context");
  }

  const { lat, lng } = getOrderLatLng(order);
  const regionKey = normalizeRegionKey({ lat, lng, precision: 2 });

  const snapshot = buildDemandSnapshot({
    activeOrders,
    onlineDrivers,
    completedOrdersLastHour,
    cancelledOrdersLastHour,
    avgEtaMinutes,
  });

  const record = buildDemandPredictionRecord({
    serviceType,
    regionKey,
    predictionWindowMinutes: 30,
    snapshot,
  });

  const { data, error } = await supabase
    .from("dispatch_demand_predictions")
    .insert(record)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return {
    region_key: regionKey,
    prediction: data,
    snapshot,
  };
}

export async function createDriverRepositionTasks({
  supabase,
  serviceType = "taxi",
  regionKey,
  predictedDriversNeeded = 0,
}) {
  if (!supabase || !regionKey) {
    throw new Error("invalid_reposition_context");
  }

  if (!predictedDriversNeeded || predictedDriversNeeded <= 0) {
    return [];
  }

  const { data: drivers, error } = await supabase
    .from("driver_presence")
    .select("driver_id, active_service_type, lat, lng, last_seen_at")
    .eq("is_online", true)
    .limit(predictedDriversNeeded);

  if (error) {
    throw error;
  }

  const tasks = (drivers || []).map((driver, index) => ({
    driver_id: driver.driver_id,
    service_type: serviceType,
    target_region_key: regionKey,
    reason: "predicted_demand",
    priority: Number((1 - index / Math.max(predictedDriversNeeded, 1)).toFixed(4)),
    status: "pending",
    expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
  }));

  if (!tasks.length) return [];

  const { data: inserted, error: insertError } = await supabase
    .from("driver_reposition_tasks")
    .insert(tasks)
    .select("*");

  if (insertError) {
    throw insertError;
  }

  return inserted || [];
}
