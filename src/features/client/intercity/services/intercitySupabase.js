import { supabase } from "../../../../lib/supabase";

export async function listInterProvTrips({
  fromRegionName,
  toRegionName,
  fromDistrict,
  toDistrict,
  limit = 50,
}) {
  let q = supabase
    .from("inter_prov_trips")
    .select("*")
    .order("depart_at", { ascending: true })
    .limit(limit);

  if (fromRegionName) q = q.eq("from_region", fromRegionName);
  if (toRegionName) q = q.eq("to_region", toRegionName);
  if (fromDistrict) q = q.eq("from_district", fromDistrict);
  if (toDistrict) q = q.eq("to_district", toDistrict);

  q = q.in("status", ["active", "draft"]);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createSeatRequest({
  tripId,
  clientUserId,
  seats = 1,
  notes = "",
}) {
  const payload = {
    trip_id: tripId,
    user_id: clientUserId,
    seats,
    notes,
    status: "pending",
  };

  const { data, error } = await supabase
    .from("inter_prov_seat_requests")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function listInterProvParcelOffers({ fromRegionName, toRegionName, limit = 20 }) {
  let q = supabase
    .from("inter_prov_trips")
    .select("*")
    .eq("parcel_enabled", true)
    .in("status", ["active", "draft"])
    .order("depart_at", { ascending: true })
    .limit(limit);

  if (fromRegionName) q = q.eq("from_region", fromRegionName);
  if (toRegionName) q = q.eq("to_region", toRegionName);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
