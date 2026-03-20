import { normalizeInterDistrictRequestPayload, normalizeInterDistrictTripPayload } from "@/modules/shared/interdistrict/domain/interDistrictSchemas";
import { INTERDISTRICT_TRIP_STATUS, isFinishedInterDistrictStatus, normalizeInterDistrictStatus, toDbInterDistrictStatus } from "@/modules/shared/interdistrict/domain/interDistrictStatuses";
import { supabase } from "@/services/supabase/supabaseClient";

export async function listPitaks({ region, from_district, to_district, activeOnly = true } = {}) {
  let q = supabase.from("district_pitaks").select("*").order("updated_at", { ascending: false });
  if (region) q = q.eq("region", region);
  if (from_district) q = q.eq("from_district", from_district);
  if (to_district) q = q.eq("to_district", to_district);
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function upsertPitak(pitak) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!userData?.user?.id) throw new Error("Login qiling");
  const payload = {
    id: pitak?.id || undefined,
    region: pitak.region,
    from_district: pitak.from_district,
    to_district: pitak.to_district,
    title: pitak.title,
    location_point: pitak.location_point || null,
    is_active: pitak.is_active ?? true,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("district_pitaks").upsert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function deletePitak(id) {
  const { error } = await supabase.from("district_pitaks").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function createTrip(trip) {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  const uid = authData?.user?.id;
  if (!uid) throw new Error("Login qiling");
  const payload = {
    user_id: uid,
    ...normalizeInterDistrictTripPayload(trip),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("district_trips").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function searchTrips(params = {}) {
  const { region, from_district, to_district, depart_from, depart_to, has_ac, has_trunk, tariff, include_delivery = true } = params;
  let q = supabase
    .from("district_trips")
    .select("*")
    .in("status", [
      toDbInterDistrictStatus(INTERDISTRICT_TRIP_STATUS.SEARCHING),
      toDbInterDistrictStatus(INTERDISTRICT_TRIP_STATUS.MATCHED),
      toDbInterDistrictStatus(INTERDISTRICT_TRIP_STATUS.ACCEPTED),
    ])
    .order("depart_at", { ascending: true });
  if (region) q = q.eq("region", region);
  if (from_district) q = q.eq("from_district", from_district);
  if (to_district) q = q.eq("to_district", to_district);
  if (tariff) q = q.eq("tariff", tariff);
  if (has_ac === true) q = q.eq("has_ac", true);
  if (has_trunk === true) q = q.eq("has_trunk", true);
  if (include_delivery === false) q = q.eq("has_delivery", false);
  if (depart_from) q = q.gte("depart_at", depart_from);
  if (depart_to) q = q.lte("depart_at", depart_to);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((trip) => ({
    ...trip,
    meeting_points: Array.isArray(trip.meeting_points) ? trip.meeting_points : [],
    match_type: params.from_point || params.to_point ? 'corridor_candidate' : 'exact',
  }));
}

export async function requestTrip(req) {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  const uid = authData?.user?.id;
  if (!uid) throw new Error("Login qiling");
  const payload = {
    user_id: uid,
    ...normalizeInterDistrictRequestPayload(req),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("district_trip_requests").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function listDriverRequests({ limit = 50 } = {}) {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  const uid = authData?.user?.id;
  if (!uid) throw new Error("Login qiling");
  const { data: trips, error: tErr } = await supabase.from("district_trips").select("id").eq("user_id", uid);
  if (tErr) throw tErr;
  const tripIds = (trips || []).map((t) => t.id);
  if (!tripIds.length) return [];
  const { data, error } = await supabase.from("district_trip_requests").select("*").in("trip_id", tripIds).order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}


export async function getClientActiveTrip() {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  const uid = authData?.user?.id;
  if (!uid) throw new Error("Login qiling");
  const { data, error } = await supabase
    .from("district_trip_requests")
    .select("*, district_trips(*)")
    .eq("user_id", uid)
    .order("updated_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  const active = (data || []).find((item) => !isFinishedInterDistrictStatus(item.status));
  if (!active) return null;
  return {
    ...active,
    status: normalizeInterDistrictStatus(active.status),
    trip: active.district_trips || null,
  };
}

export async function cancelTripRequest({ request_id, reason }) {
  const payload = {
    status: toDbInterDistrictStatus(INTERDISTRICT_TRIP_STATUS.CANCELED),
    cancel_reason: reason || "client_cancelled",
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("district_trip_requests")
    .update(payload)
    .eq("id", request_id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function respondTripRequest({ request_id, status }) {
  const { error } = await supabase
    .from("district_trip_requests")
    .update({ status: toDbInterDistrictStatus(status), updated_at: new Date().toISOString() })
    .eq("id", request_id);
  if (error) throw error;
  return true;
}
