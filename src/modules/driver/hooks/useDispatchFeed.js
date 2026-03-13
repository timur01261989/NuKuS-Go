import { useCallback, useEffect, useState } from "react";
import { subscribeDriverOrders } from "@/services/dispatch/dispatchRealtime";

export function useDispatchFeed(driverId) {
  const [orders, setOrders] = useState([]);

  const handleOrder = useCallback((order) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  useEffect(() => {
    if (!driverId) {
      setOrders([]);
      return undefined;
    }

    const unsubscribe = subscribeDriverOrders(driverId, handleOrder);
    return () => {
      unsubscribe?.();
    };
  }, [driverId, handleOrder]);

  return orders;
}

export default useDispatchFeed;
