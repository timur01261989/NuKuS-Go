
import { supabase } from "../../../services/supabase/supabaseClient"

export async function updateDriverPresence(driverId, lat, lng, serviceType){

  const payload = {
    driver_id: driverId,
    lat,
    lng,
    state: "online",
    active_service_type: serviceType,
    last_seen_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from("driver_presence")
    .upsert(payload,{ onConflict:"driver_id" })

  if(error){
    console.error("driverPresence error",error)
  }

}
