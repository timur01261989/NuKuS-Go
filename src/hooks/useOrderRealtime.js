import { useEffect, useRef, useState } from 'react';
import { subscribeOrder } from '../services/ordersRealtime.js';

export function useOrderRealtime(orderId) {
  const [lastPayload, setLastPayload] = useState(null);
  const [order, setOrder] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!orderId) return;

    if (unsubRef.current) unsubRef.current();

    unsubRef.current = subscribeOrder(orderId, (payload) => {
      setLastPayload(payload);
      if (payload?.new) setOrder(payload.new);
      else if (payload?.eventType === 'DELETE') setOrder(null);
    });

    return () => {
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = null;
    };
  }, [orderId]);

  return { order, lastPayload };
}
