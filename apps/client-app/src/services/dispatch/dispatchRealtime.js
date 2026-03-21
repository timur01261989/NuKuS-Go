
import { supabase } from "../supabase/supabaseClient"

export function subscribeDriverOrders(driverId,callback){

  const channel = supabase
    .channel("dispatch-driver-"+driverId)
    .on(
      "postgres_changes",
      {
        event:"INSERT",
        schema:"public",
        table:"dispatch_events",
        filter:`driver_id=eq.${driverId}`
      },
      payload=>{

        const order = payload.new
        callback(order)

      }
    )
    .subscribe()

  return ()=> supabase.removeChannel(channel)

}
