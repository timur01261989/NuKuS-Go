import { supabase } from "@lib/supabase";

export const SERVICE_TYPES = [
  { key: "city_taxi", label: "Taksi" },
  { key: "intercity", label: "Viloyatlar aro" },
  { key: "interdistrict", label: "Tumanlar aro" },
  { key: "freight", label: "Yuk" },
  { key: "delivery", label: "Eltish" },
];

/**
 * Upsert per-service online/offline and optional coordinates.
 */
export async function setServiceOnline({ driverId, serviceType, isOnline, lat = null, lng = null }) {
  if (!driverId) throw new Error("driverId required");
  const payload = {
    driver_id: driverId,
    service_type: serviceType,
    is_online: !!isOnline,
    lat,
    lng,
  };

  const { data, error } = await supabase
    .from("driver_service_presence")
    .upsert(payload, { onConflict: "driver_id,service_type" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchServicePresence({ driverId }) {
  const { data, error } = await supabase
    .from("driver_service_presence")
    .select("service_type,is_online,lat,lng,updated_at")
    .eq("driver_id", driverId);

  if (error) throw error;
  const map = {};
  (data || []).forEach((r) => (map[r.service_type] = r));
  return map;
}

export async function setAllServicesOnline({ driverId, isOnline, lat = null, lng = null }) {
  const rows = SERVICE_TYPES.map((s) => ({
    driver_id: driverId,
    service_type: s.key,
    is_online: !!isOnline,
    lat,
    lng,
  }));
  const { error } = await supabase
    .from("driver_service_presence")
    .upsert(rows, { onConflict: "driver_id,service_type" });
  if (error) throw error;
  return true;
}
