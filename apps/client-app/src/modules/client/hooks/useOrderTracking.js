import { useCallback, useMemo } from "react";
import trackingService from "../services/trackingService";

export default function useOrderTracking(orderId) {
  const subscribe = useCallback((onChange) => {
    if (!orderId || typeof trackingService.subscribeOrder !== "function") {
      return () => {};
    }
    return trackingService.subscribeOrder(orderId, onChange);
  }, [orderId]);

  return useMemo(() => ({ subscribe }), [subscribe]);
}
