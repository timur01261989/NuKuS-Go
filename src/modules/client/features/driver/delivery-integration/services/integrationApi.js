/**
 * integrationApi.js
 * parcels va active rides bilan ishlash.
 *
 * configureIntegrationApi({ apiHelper, supabase }) orqali ulaysiz.
 */
let _apiHelper = null;
let _supabase = null;

export function configureIntegrationApi({ apiHelper, supabase }) {
  _apiHelper = apiHelper || null;
  _supabase = supabase || null;
}


function normalizeParcelRow(row = {}) {
  const serviceArea = row.service_area || row.serviceArea || row.mode || row.driver_mode || null;
  const orderType = row.order_type || row.orderType || (row.is_freight ? "freight" : "delivery");
  const weightKg = Number(row.weight_kg ?? row.weightKg ?? row.cargo_weight_kg ?? row.max_kg ?? 0);
  const volumeM3 = Number(row.volume_m3 ?? row.volumeM3 ?? row.cargo_volume_m3 ?? row.max_volume_m3 ?? 0);
  return { ...row, serviceArea, orderType, weightKg, volumeM3 };
}

function filterParcels(rows = [], params = {}) {
  const serviceArea = params.serviceArea || null;
  const orderType = params.orderType || null;
  const maxWeightKg = Number(params.maxWeightKg ?? 0);
  const maxVolumeM3 = Number(params.maxVolumeM3 ?? 0);
  return rows
    .map(normalizeParcelRow)
    .filter((row) => {
      if (serviceArea && row.serviceArea && row.serviceArea !== serviceArea) return false;
      if (orderType && row.orderType && row.orderType !== orderType) return false;
      if (maxWeightKg > 0 && Number(row.weightKg || 0) > maxWeightKg) return false;
      if (maxVolumeM3 > 0 && Number(row.volumeM3 || 0) > maxVolumeM3) return false;
      return true;
    });
}

function assertConfigured() {
  if (!_apiHelper && !_supabase) {
    throw new Error("integrationApi konfiguratsiya qilinmagan. configureIntegrationApi({ apiHelper, supabase }) chaqiring.");
  }
}

export async function listParcels(params = {}) {
  assertConfigured();
  if (_apiHelper) {
    const res = await _apiHelper.post("/api/delivery", { action: "list_parcels", ...params });
    return res?.data || res || [];
  }
  const q = _supabase.from("parcels").select("*").eq("status", "searching").order("created_at", { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  return filterParcels(data || [], params);
}

export async function acceptParcel({ parcelId, driverId, rideId, payload = {} }) {
  assertConfigured();
  if (_apiHelper) {
    return _apiHelper.post("/api/delivery", { action: "accept_parcel", parcelId, driverId, rideId, payload });
  }
  const { data, error } = await _supabase
    .from("parcels")
    .update({ status: "accepted", driver_id: driverId, accepted_at: new Date().toISOString(), ...payload })
    .eq("id", parcelId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function markParcelPickup({ parcelId, photoUrl, note }) {
  assertConfigured();
  if (_apiHelper) {
    return _apiHelper.post("/api/delivery", { action: "pickup_parcel", parcelId, photoUrl, note });
  }
  const { data, error } = await _supabase
    .from("parcels")
    .update({ status: "pickup", pickup_photo: photoUrl || null, pickup_note: note || null, pickup_at: new Date().toISOString() })
    .eq("id", parcelId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function completeParcel({ parcelId, secureCode }) {
  assertConfigured();
  if (_apiHelper) {
    return _apiHelper.post("/api/delivery", { action: "complete_parcel", parcelId, secureCode });
  }
  const { data, error } = await _supabase
    .from("parcels")
    .update({ status: "completed", completed_at: new Date().toISOString(), delivered_code: secureCode || null })
    .eq("id", parcelId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export function buildParcelSmsText({ fromCity, toCity, vehiclePlate, photoLink, deepLink }) {
  const lines = [
    "📦 Sizga pochta kelyapti!",
    (fromCity && toCity) ? `🚗 Yo'nalish: ${fromCity} ➜ ${toCity}` : null,
    vehiclePlate ? `🚘 Mashina: ${vehiclePlate}` : null,
    photoLink ? `🖼 Rasm: ${photoLink}` : null,
    deepLink ? `🔗 Kuzatish: ${deepLink}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}
