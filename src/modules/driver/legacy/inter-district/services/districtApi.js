import { supabase } from "@/services/supabase/supabaseClient";

const TBL_QUEUE = "queues";
const TBL_REQUESTS = "district_trip_requests";
const TBL_LOCATIONS = "locations";
const TBL_TRIPS = "district_trips";

async function requireUserId() {
  if (!supabase) throw new Error("Supabase client topilmadi");
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data?.user?.id || null;
  if (!userId) throw new Error("Login qiling");
  return userId;
}

export async function upsertDriverLocation({ user_id, lat, lng, mode }) {
  const userId = user_id || await requireUserId();
  const payload = {
    driver_id: userId,
    lat,
    lng,
    mode,
    updated_at: new Date().toISOString(),
  };
  return supabase.from(TBL_LOCATIONS).upsert(payload, { onConflict: "driver_id" });
}

export async function createInterDistrictTrip(data) {
  const userId = data.user_id || await requireUserId();
  const payload = {
    user_id: userId,
    region: data.region,
    from_district: data.from_district,
    to_district: data.to_district,
    tariff: data.tariff,
    pitak_id: data.pitak_id || null,
    from_point: data.from_point || null,
    to_point: data.to_point || null,
    meeting_points: Array.isArray(data.meeting_points) ? data.meeting_points : [],
    route_polyline: Array.isArray(data.route_polyline) ? data.route_polyline : [],
    depart_at: data.depart_at,
    seats_total: data.seats_total || 4,
    allow_full_salon: !!data.allow_full_salon,
    base_price_uzs: data.base_price_uzs,
    pickup_fee_uzs: data.pickup_fee_uzs || 0,
    dropoff_fee_uzs: data.dropoff_fee_uzs || 0,
    waiting_fee_uzs: data.waiting_fee_uzs || 0,
    full_salon_price_uzs: data.full_salon_price_uzs || null,
    has_ac: !!data.has_ac,
    has_trunk: !!data.has_trunk,
    is_lux: !!data.is_lux,
    has_delivery: !!data.has_delivery,
    delivery_price_uzs: data.delivery_price_uzs || null,
    notes: data.notes || "",
    women_only: !!data.women_only,
    booking_mode: data.booking_mode || "approval",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: result, error } = await supabase.from(TBL_TRIPS).insert([payload]).select();
  if (error) throw error;
  return result;
}

export async function joinQueue({ user_id, zone = "NUKUS_AVTOVOKZAL" }) {
  const userId = user_id || await requireUserId();
  return supabase.from(TBL_QUEUE).insert([{
    driver_id: userId,
    zone,
    created_at: new Date().toISOString(),
  }]);
}

export async function getQueuePosition({ user_id, zone = "NUKUS_AVTOVOKZAL" }) {
  const userId = user_id || await requireUserId();
  const { data, error } = await supabase
    .from(TBL_QUEUE)
    .select("id, driver_id, created_at")
    .eq("zone", zone)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const idx = (data || []).findIndex((x) => x.driver_id === userId);
  return {
    position: idx >= 0 ? idx + 1 : null,
    total: (data || []).length,
  };
}

export async function listPremiumRequests() {
  return supabase
    .from(TBL_REQUESTS)
    .select("*")
    .in("status", ["new", "pending"])
    .order("created_at", { ascending: false });
}

export async function listDriverRequests({ limit = 100 } = {}) {
  const userId = await requireUserId();
  const { data: trips, error: tripsError } = await supabase.from(TBL_TRIPS).select("id").eq("user_id", userId);
  if (tripsError) throw tripsError;
  const tripIds = (trips || []).map((item) => item.id).filter(Boolean);
  if (!tripIds.length) return [];

  const { data, error } = await supabase
    .from(TBL_REQUESTS)
    .select("*")
    .in("trip_id", tripIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function acceptRequest({ request_id }) {
  return supabase
    .from(TBL_REQUESTS)
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", request_id);
}

export async function respondTripRequest(requestId, status) {
  const { data, error } = await supabase
    .from(TBL_REQUESTS)
    .update({
      status,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) throw error;
  return data;
}

export async function declineRequest({ request_id }) {
  return supabase
    .from(TBL_REQUESTS)
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", request_id);
}
