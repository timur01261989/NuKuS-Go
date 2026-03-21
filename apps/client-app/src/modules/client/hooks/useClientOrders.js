import { useCallback, useEffect, useMemo, useState } from "react";
import clientOrderService from "../services/clientOrderService.js";

export default function useClientOrders(params = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stableParams = useMemo(
    () => ({
      userId: params.userId ?? null,
      limit: params.limit ?? 50,
      status: params.status ?? null,
      subscribe: params.subscribe ?? true,
    }),
    [params.limit, params.status, params.subscribe, params.userId],
  );

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextOrders = await clientOrderService.listOrders(stableParams);
      setOrders(Array.isArray(nextOrders) ? nextOrders : []);
      return nextOrders;
    } catch (loadError) {
      setError(loadError);
      return [];
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

  useEffect(() => {
    let active = true;
    loadOrders().then((result) => {
      if (!active) return;
      setOrders(Array.isArray(result) ? result : []);
    });

    if (!stableParams.subscribe) {
      return () => {
        active = false;
      };
    }

    const unsubscribe = clientOrderService.subscribeOrders(stableParams, (nextValue) => {
      if (!active) return;
      if (Array.isArray(nextValue)) {
        setOrders(nextValue);
        return;
      }
      if (nextValue && typeof nextValue === "object") {
        setOrders((previous) => {
          const id = nextValue.id;
          if (!id) return previous;
          const index = previous.findIndex((item) => item?.id === id);
          if (index === -1) {
            return [nextValue, ...previous];
          }
          const copy = previous.slice();
          copy[index] = { ...copy[index], ...nextValue };
          return copy;
        });
      }
    });

    return () => {
      active = false;
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [loadOrders, stableParams]);

  return useMemo(
    () => ({
      orders,
      loading,
      error,
      reload: loadOrders,
    }),
    [error, loadOrders, loading, orders],
  );
}
