import { useEffect, useRef, useState } from 'react';
import { subscribeDriverLocation } from '../services/ordersRealtime.js';

export function useDriverLocationRealtime(orderId) {
  const [lastPayload, setLastPayload] = useState(null);
  const [location, setLocation] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!orderId) return;

    if (unsubRef.current) unsubRef.current();

    unsubRef.current = subscribeDriverLocation(orderId, (payload) => {
      setLastPayload(payload);
      if (payload?.new) setLocation(payload.new);
      else if (payload?.eventType === 'DELETE') setLocation(null);
    });

    return () => {
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = null;
    };
  }, [orderId]);

  return { location, lastPayload };
}
