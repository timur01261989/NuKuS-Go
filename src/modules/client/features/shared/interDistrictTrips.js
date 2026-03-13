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
    region: trip.region,
    from_district: trip.from_district,
    to_district: trip.to_district,
    tariff: trip.tariff,
    pitak_id: trip.pitak_id || null,
    from_point: trip.from_point || null,
    to_point: trip.to_point || null,
    meeting_points: trip.meeting_points || [],
    route_polyline: trip.route_polyline || [],
    depart_at: trip.depart_at,
    seats_total: trip.seats_total ?? null,
    allow_full_salon: !!trip.allow_full_salon,
    base_price_uzs: Number(trip.base_price_uzs || 0),
    pickup_fee_uzs: Number(trip.pickup_fee_uzs || 0),
    dropoff_fee_uzs: Number(trip.dropoff_fee_uzs || 0),
    waiting_fee_uzs: Number(trip.waiting_fee_uzs || 0),
    full_salon_price_uzs: trip.full_salon_price_uzs == null ? null : Number(trip.full_salon_price_uzs),
    has_ac: !!trip.has_ac,
    has_trunk: !!trip.has_trunk,
    is_lux: !!trip.is_lux,
    allow_smoking: !!trip.allow_smoking,
    has_delivery: !!trip.has_delivery,
    delivery_price_uzs: trip.delivery_price_uzs == null ? null : Number(trip.delivery_price_uzs),
    notes: trip.notes || null,
    women_only: !!trip.women_only,
    booking_mode: trip.booking_mode || 'approval',
    status: trip.status || "active",
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("district_trips").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function searchTrips(params = {}) {
  const { region, from_district, to_district, depart_from, depart_to, has_ac, has_trunk, tariff, include_delivery = true } = params;
  let q = supabase.from("district_trips").select("*").eq("status", "active").order("depart_at", { ascending: true });
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
    trip_id: req.trip_id,
    user_id: uid,
    seats_requested: req.seats_requested ?? null,
    wants_full_salon: !!req.wants_full_salon,
    pickup_address: req.pickup_address || null,
    dropoff_address: req.dropoff_address || null,
    pickup_point: req.pickup_point || null,
    dropoff_point: req.dropoff_point || null,
    meeting_point_id: req.meeting_point_id || null,
    is_delivery: !!req.is_delivery,
    delivery_notes: req.delivery_notes || null,
    weight_category: req.weight_category || null,
    payment_method: req.payment_method || null,
    final_price: req.final_price == null ? null : Number(req.final_price),
    selected_seats: Array.isArray(req.selected_seats) ? req.selected_seats : [],
    status: req.status || "pending",
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

export async function respondTripRequest({ request_id, status }) {
  const { error } = await supabase.from("district_trip_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", request_id);
  if (error) throw error;
  return true;
}
