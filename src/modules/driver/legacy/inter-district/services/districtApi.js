import { normalizeInterDistrictTripPayload } from "@/modules/shared/interdistrict/domain/interDistrictSchemas";
import { INTERDISTRICT_TRIP_STATUS, toDbInterDistrictStatus } from "@/modules/shared/interdistrict/domain/interDistrictStatuses";
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
    ...normalizeInterDistrictTripPayload(data),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: result, error } = await supabase.from(TBL_TRIPS).insert([payload]).select().single();
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
    .in("status", [
      toDbInterDistrictStatus(INTERDISTRICT_TRIP_STATUS.SEARCHING),
      toDbInterDistrictStatus(INTERDISTRICT_TRIP_STATUS.MATCHED),
    ])
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
      status: toDbInterDistrictStatus(INTERDISTRICT_TRIP_STATUS.ACCEPTED),
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", request_id);
}

export async function respondTripRequest(requestId, status) {
  const { data, error } = await supabase
    .from(TBL_REQUESTS)
    .update({
      status: toDbInterDistrictStatus(status),
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
      status: toDbInterDistrictStatus(INTERDISTRICT_TRIP_STATUS.CANCELED),
      rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", request_id);
}
