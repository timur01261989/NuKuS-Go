
import { useEffect, useState } from "react"
import { subscribeDriverOrders } from "../../../services/dispatch/dispatchRealtime"

export function useDispatchFeed(driverId){

  const [orders,setOrders] = useState([])

  useEffect(()=>{

    if(!driverId) return

    const unsubscribe = subscribeDriverOrders(driverId,(order)=>{

      setOrders(prev => [order,...prev])

    })

    return ()=> unsubscribe()

  },[driverId])

  return orders

}
