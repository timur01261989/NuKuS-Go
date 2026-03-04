import { supabase } from "@/lib/supabase";

/**
 * interDistrictTrips.js
 * DB + API (Supabase) layer for Inter-District (Tumanlar aro) trips.
 *
 * Tables (see sql/interdistrict_trips_schema.sql):
 * - district_pitaks
 * - district_trips
 * - district_trip_requests
 *
 * NOTE: This file uses Supabase directly (client-side).
 * If you want stricter security, you can later proxy via server/api.
 */

const TBL_PITAKS = "district_pitaks";
const TBL_TRIPS = "district_trips";
const TBL_REQS = "district_trip_requests";

/** ------------------ Pitak (Admin-managed) ------------------ */

export async function listPitaks({ region, isActive = true }) {
  if (!supabase) throw new Error("Supabase client topilmadi");
  let q = supabase.from(TBL_PITAKS).select("*").order("name", { ascending: true });
  if (region) q = q.eq("region", region);
  if (isActive != null) q = q.eq("is_active", !!isActive);
  return q;
}

export async function upsertPitak(pitak) {
  if (!supabase) throw new Error("Supabase client topilmadi");
  // pitak: {id?, region, district?, name, point:{lat,lng}, note?, is_active?}
  const payload = {
    ...pitak,
    updated_at: new Date().toISOString(),
  };
  if (!payload.created_at) payload.created_at = new Date().toISOString();
  return supabase.from(TBL_PITAKS).upsert(payload).select("*").single();
}

export async function deletePitak(id) {
  if (!supabase) throw new Error("Supabase client topilmadi");
  return supabase.from(TBL_PITAKS).delete().eq("id", id);
}

/** ------------------ Driver Trips ------------------ */

export async function createTrip(trip) {
  if (!supabase) throw new Error("Supabase client topilmadi");
  const payload = {
    ...trip,
    status: trip.status || "open",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return supabase.from(TBL_TRIPS).insert(payload).select("*").single();
}

export async function updateTrip(id, patch) {
  if (!supabase) throw new Error("Supabase client topilmadi");
  const payload = { ...patch, updated_at: new Date().toISOString() };
  return supabase.from(TBL_TRIPS).update(payload).eq("id", id).select("*").single();
}

export async function listDriverTrips({ driver_id, status = "open" }) {
  if (!supabase) throw new Error("Supabase client topilmadi");
  let q = supabase.from(TBL_TRIPS).select("*").eq("driver_id", driver_id).order("depart_at", { ascending: true });
  if (status) q = q.eq("status", status);
  return q;
}

/** ------------------ Client Search & Request ------------------ */

export async function searchTrips({
  region,
  from_district,
  to_district,
  mode, // "pitak" | "door"
  depart_from,
  depart_to,
  filters = {},
}) {
  if (!supabase) throw new Error("Supabase client topilmadi");
  let q = supabase
    .from(TBL_TRIPS)
    .select("*")
    .eq("status", "open")
    .order("depart_at", { ascending: true });

  if (region) q = q.eq("region", region);
  if (from_district) q = q.eq("from_district", from_district);
  if (to_district) q = q.eq("to_district", to_district);
  if (mode) q = q.eq("mode", mode);

  if (depart_from) q = q.gte("depart_at", depart_from);
  if (depart_to) q = q.lte("depart_at", depart_to);

  if (filters.ac) q = q.eq("has_ac", true);
  if (filters.trunk) q = q.eq("has_trunk", true);
  if (filters.smoking === false) q = q.eq("allow_smoking", false);

  return q;
}

export async function requestTrip({
  trip_id,
  client_id,
  client_name,
  client_phone,
  seats = 1,
  wants_full_salon = false,
  pickup_address = null,
  pickup_point = null,
  dropoff_address = null,
  dropoff_point = null,
  note = null,
}) {
  if (!supabase) throw new Error("Supabase client topilmadi");
  const payload = {
    trip_id,
    client_id,
    client_name,
    client_phone,
    seats,
    wants_full_salon,
    pickup_address,
    pickup_point,
    dropoff_address,
    dropoff_point,
    note,
    status: "sent",
    created_at: new Date().toISOString(),
  };
  return supabase.from(TBL_REQS).insert(payload).select("*").single();
}

/** ------------------ Driver: requests inbox ------------------ */

export async function listTripRequestsForDriver({ driver_id }) {
  if (!supabase) throw new Error("Supabase client topilmadi");
  // Join via trip_id -> trips.driver_id (client-side join is limited). We'll fetch trips then requests.
  const { data: trips, error: tErr } = await supabase.from(TBL_TRIPS).select("id").eq("driver_id", driver_id);
  if (tErr) throw tErr;
  const ids = (trips || []).map((t) => t.id);
  if (!ids.length) return { data: [], error: null };
  return supabase
    .from(TBL_REQS)
    .select("*")
    .in("trip_id", ids)
    .order("created_at", { ascending: false });
}

export async function respondTripRequest({ request_id, status }) {
  if (!supabase) throw new Error("Supabase client topilmadi");
  if (!["accepted", "declined"].includes(status)) throw new Error("status noto'g'ri");
  return supabase.from(TBL_REQS).update({ status, responded_at: new Date().toISOString() }).eq("id", request_id).select("*").single();
}
