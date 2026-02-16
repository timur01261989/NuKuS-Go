import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { useMarketStore } from "../stores/marketStore";
import { listCars, getCarById, createCarAd, listMyAds } from "../services/marketApi";

/**
 * 📊 MarketContext.jsx (Modulning "Miyasi")
 *
 * Vazifalari:
 * - Supabase/API'dan mashinalarni yuklash (feed, details, my ads)
 * - Filtrlash/sortlash holatini store orqali boshqarish
 * - Global state: loading/error + cars list + pagination
 */

const MarketCtx = createContext(null);

export function MarketProvider({ children }) {
  const { filters, setFilters } = useMarketStore();

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCars({ filters, page: 1 });
      setCars(res.items || []);
      setHasMore(Boolean(res.hasMore));
      setPage(1);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setLoading(true);
    setError(null);
    try {
      const res = await listCars({ filters, page: next });
      setCars((prev) => [...prev, ...(res.items || [])]);
      setHasMore(Boolean(res.hasMore));
      setPage(next);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [filters, page, hasMore, loading]);

  const fetchDetails = useCallback(async (id) => {
    return await getCarById(id);
  }, []);

  const submitAd = useCallback(async (draft) => {
    return await createCarAd(draft);
  }, []);

  const fetchMyAds = useCallback(async () => {
    return await listMyAds();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      cars,
      loading,
      error,
      hasMore,
      filters,
      setFilters,
      refresh,
      loadMore,
      fetchDetails,
      submitAd,
      fetchMyAds,
    }),
    [cars, loading, error, hasMore, filters, setFilters, refresh, loadMore, fetchDetails, submitAd, fetchMyAds]
  );

  return <MarketCtx.Provider value={value}>{children}</MarketCtx.Provider>;
}

export function useMarket() {
  const ctx = useContext(MarketCtx);
  if (!ctx) throw new Error("useMarket must be used within MarketProvider");
  return ctx;
}
