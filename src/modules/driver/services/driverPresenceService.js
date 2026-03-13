import { supabase } from "@/services/supabase/supabaseClient";

export async function updateDriverPresence(driverId, lat, lng, serviceType) {
  if (!driverId || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return false;
  }

  const payload = {
    driver_id: driverId,
    lat: Number(lat),
    lng: Number(lng),
    state: "online",
    active_service_type: serviceType ?? null,
    last_seen_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("driver_presence")
    .upsert(payload, { onConflict: "driver_id" });

  if (error) {
    console.error("driverPresence error", error);
    return false;
  }

  return true;
}

export async function setDriverOffline(driverId) {
  if (!driverId) return false;

  const { error } = await supabase
    .from("driver_presence")
    .update({ state: "offline", last_seen_at: new Date().toISOString() })
    .eq("driver_id", driverId);

  if (error) {
    console.error("setDriverOffline error", error);
    return false;
  }

  return true;
}

export default {
  updateDriverPresence,
  setDriverOffline,
};
