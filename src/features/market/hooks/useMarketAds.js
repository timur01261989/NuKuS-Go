
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listAds } from "../services/marketApi";
import useDebouncedValue from "./useDebouncedValue";

export default function useMarketAds(filters, pageSize = 12) {
  const debouncedFilters = useDebouncedValue(filters, 250);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const tokenRef = useRef(0);

  const reset = useCallback(() => {
    setItems([]);
    setTotal(0);
    setPage(1);
    setDone(false);
  }, []);

  const load = useCallback(async (p) => {
    const token = ++tokenRef.current;
    setLoading(true);
    try {
      const res = await listAds({ page: p, pageSize, filters: debouncedFilters });
      if (tokenRef.current !== token) return;
      const nextItems = res?.items || [];
      setTotal(res?.total || 0);
      setItems((prev) => (p === 1 ? nextItems : [...prev, ...nextItems]));
      setDone((p * pageSize) >= (res?.total || 0) || nextItems.length === 0);
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters, pageSize]);

  useEffect(() => {
    reset();
    load(1);
  }, [debouncedFilters, reset, load]);

  const loadMore = useCallback(() => {
    if (loading || done) return;
    const next = page + 1;
    setPage(next);
    load(next);
  }, [page, load, loading, done]);

  const state = useMemo(() => ({ items, total, page, loading, done }), [items, total, page, loading, done]);
  return { ...state, loadMore, reset };
}
