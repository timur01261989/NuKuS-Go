
/**
 * integrationApi.js
 * Delivery driver integration canonical layer.
 * Legacy "parcel" nomlari saqlanadi, lekin source-of-truth delivery_orders.
 */
import { normalizeDeliveryOrder, normalizeDeliveryStatus, toDeliveryDriverAction } from "@/modules/shared/domain/delivery/statusMap.js";
import { logisticsLogger } from "@/modules/shared/domain/logistics/logisticsLogger.js";

let _apiHelper = null;
let _supabase = null;

export function configureIntegrationApi({ apiHelper, supabase }) {
  _apiHelper = apiHelper || null;
  _supabase = supabase || null;
}

function assertConfigured() {
  if (!_apiHelper && !_supabase) {
    throw new Error("integrationApi konfiguratsiya qilinmagan. configureIntegrationApi({ apiHelper, supabase }) chaqiring.");
  }
}

function filterOrders(rows = [], params = {}) {
  const serviceArea = params.serviceArea || null;
  const maxWeightKg = Number(params.maxWeightKg ?? 0);
  const list = Array.isArray(rows) ? rows.map(normalizeDeliveryOrder) : [];
  return list.filter((row) => {
    if (serviceArea && row.serviceArea && row.serviceArea !== serviceArea) return false;
    if (maxWeightKg > 0 && Number(row.weight_kg || 0) > maxWeightKg) return false;
    return ["searching", "accepted", "picked_up"].includes(row.status);
  });
}

async function listDriverOrdersViaApi() {
  const res = await _apiHelper.post("/api/delivery", { action: "list_driver_orders" });
  return Array.isArray(res?.orders) ? res.orders : Array.isArray(res?.data?.orders) ? res.data.orders : [];
}

export async function listParcels(params = {}) {
  assertConfigured();
  if (_apiHelper) {
    const rows = await listDriverOrdersViaApi();
    return filterOrders(rows, params);
  }
  const { data, error } = await _supabase
    .from("delivery_orders")
    .select("*")
    .in("status", ["searching", "pending", "accepted", "pickup", "picked_up"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return filterOrders(data || [], params);
}

export async function acceptParcel({ parcelId, driverId, rideId, payload = {} }) {
  assertConfigured();
  const patch = {
    matched_trip_id: rideId || null,
    matched_driver_user_id: driverId || null,
    driver_user_id: driverId || null,
    ...payload,
  };
  if (_apiHelper) {
    return _apiHelper.post("/api/delivery", {
      action: "driver_update_status",
      id: parcelId,
      status: toDeliveryDriverAction("searching"),
      patch,
    });
  }
  const { data, error } = await _supabase
    .from("delivery_orders")
    .update({ status: "accepted", ...patch, updated_at: new Date().toISOString() })
    .eq("id", parcelId)
    .in("status", ["searching", "pending"])
    .select("*")
    .single();
  if (error) throw error;
  return normalizeDeliveryOrder(data);
}

export async function markParcelPickup({ parcelId, photoUrl, note }) {
  assertConfigured();
  const patch = { pickup_photo: photoUrl || null, pickup_note: note || null, pickup_at: new Date().toISOString() };
  if (_apiHelper) {
    return _apiHelper.post("/api/delivery", {
      action: "driver_update_status",
      id: parcelId,
      status: toDeliveryDriverAction("accepted"),
      patch,
    });
  }
  const { data, error } = await _supabase
    .from("delivery_orders")
    .update({ status: "picked_up", ...patch, updated_at: new Date().toISOString() })
    .eq("id", parcelId)
    .select("*")
    .single();
  if (error) throw error;
  return normalizeDeliveryOrder(data);
}

export async function completeParcel({ parcelId, secureCode }) {
  assertConfigured();
  const patch = { delivered_code: secureCode || null, completed_at: new Date().toISOString() };
  if (_apiHelper) {
    return _apiHelper.post("/api/delivery", {
      action: "driver_update_status",
      id: parcelId,
      status: toDeliveryDriverAction("picked_up"),
      patch,
    });
  }
  const { data, error } = await _supabase
    .from("delivery_orders")
    .update({ status: "delivered", ...patch, updated_at: new Date().toISOString() })
    .eq("id", parcelId)
    .select("*")
    .single();
  if (error) throw error;
  return normalizeDeliveryOrder(data);
}

export function buildParcelSmsText({ fromCity, toCity, vehiclePlate, photoLink, deepLink }) {
  const lines = [
    "📦 Sizga posilka yetkazilmoqda",
    (fromCity && toCity) ? `🚗 Yo'nalish: ${fromCity} ➜ ${toCity}` : null,
    vehiclePlate ? `🚘 Mashina: ${vehiclePlate}` : null,
    photoLink ? `🖼 Rasm: ${photoLink}` : null,
    deepLink ? `🔗 Kuzatish: ${deepLink}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

export function toLegacyParcel(order = {}) {
  const normalized = normalizeDeliveryOrder(order);
  return {
    ...normalized,
    id: normalized.id,
    title: normalized.title,
    amount: normalized.amount,
    status: normalized.status,
    pickup_location: normalized.pickup_location,
    drop_location: normalized.drop_location,
    receiver_phone: normalized.receiver_phone,
    service_area: normalized.serviceArea,
  };
}

export function logIntegrationError(action, error, meta = {}) {
  logisticsLogger.error("delivery", action, {
    message: error?.message || String(error || "unknown"),
    ...meta,
  });
}
