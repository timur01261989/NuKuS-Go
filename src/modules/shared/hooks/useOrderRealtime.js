import { useEffect, useRef, useState } from 'react';
import { subscribeOrder } from '../services/ordersRealtime.js';

export function useOrderRealtime(orderId) {
  const [lastPayload, setLastPayload] = useState(null);
  const [order, setOrder] = useState(null);
  const unsubRef = useRef(null);
  const nextPayloadRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!orderId) return;

    if (unsubRef.current) unsubRef.current();

    const processPayload = (payload) => {
      nextPayloadRef.current = payload;
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        const latest = nextPayloadRef.current;
        nextPayloadRef.current = null;
        rafRef.current = null;

        setLastPayload((prev) => {
          const same = JSON.stringify(prev) === JSON.stringify(latest);
          return same ? prev : latest;
        });

        if (latest?.new) {
          setOrder((prev) => {
            const same = JSON.stringify(prev) === JSON.stringify(latest.new);
            return same ? prev : latest.new;
          });
        } else if (latest?.eventType === 'DELETE') {
          setOrder(null);
        }
      });
    };

    unsubRef.current = subscribeOrder(orderId, processPayload);

    return () => {
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = null;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [orderId]);

  return { order, lastPayload };
}
