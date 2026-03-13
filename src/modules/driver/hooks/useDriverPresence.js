
import { useEffect } from "react"
import { updateDriverPresence } from "../services/driverPresenceService"

export function useDriverPresence(driverId, serviceType){

  useEffect(()=>{

    if(!driverId) return

    const interval = setInterval(()=>{

      navigator.geolocation.getCurrentPosition(pos=>{

        const lat = pos.coords.latitude
        const lng = pos.coords.longitude

        updateDriverPresence(driverId,lat,lng,serviceType)

      })

    },5000)

    return ()=> clearInterval(interval)

  },[driverId,serviceType])

}
