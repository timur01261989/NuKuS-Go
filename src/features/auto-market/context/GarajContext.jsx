/**
 * GarajContext.jsx
 * "Mening Garajim" — localStorage asosida (Supabase ulash mumkin)
 * addToGaraj / removeFromGaraj / isInGaraj funksiyalari
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addToGaraj as apiAdd, removeFromGaraj as apiRemove, getGaraj } from "../services/marketBackend";

const GarajContext = createContext(null);

export function GarajProvider({ children }) {
  const [items, setItems] = useState([]);

  const reload = useCallback(() => {
    getGaraj().then(setItems).catch(() => {});
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const add = useCallback(async (ad) => {
    const list = await apiAdd(ad);
    setItems(list);
  }, []);

  const remove = useCallback(async (adId) => {
    const list = await apiRemove(adId);
    setItems(list);
  }, []);

  const isIn = useCallback((adId) => items.some(g => String(g.ad_id) === String(adId)), [items]);

  const value = useMemo(() => ({ items, add, remove, isIn, reload }), [items, add, remove, isIn, reload]);

  return <GarajContext.Provider value={value}>{children}</GarajContext.Provider>;
}

export function useGaraj() {
  const ctx = useContext(GarajContext);
  if (!ctx) throw new Error("useGaraj must be used inside GarajProvider");
  return ctx;
}
