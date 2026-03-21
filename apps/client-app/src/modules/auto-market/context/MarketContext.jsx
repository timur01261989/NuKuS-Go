import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const MarketContext = createContext(null);
const LS_KEY = "auto_market_filters_v1";

const defaultFilters = {
  q: "",
  city: "",
  brand: "",
  model: "",
  yearFrom: "",
  yearTo: "",
  minPrice: "",
  maxPrice: "",
  bodyType: "",
  fuel_type: "",
  batteryWarranty: false,
  kredit: false,
  exchange: false,
  transmission: "",
  color: "",
  driveType: "",
  sellerType: "",
  inspectionMin: 0,
  priceDropOnly: false,
  savedAlertOnly: false,
  sort: "recent",

  nearMe: false,
  radiusKm: 10,
  center: null,

  // YANGI: Vikup, Barter, Zapchast filtrlari
  vikup: false,         // faqat vikupga beriladiganlar
  barter: false,        // faqat barterga tayyor
  zapchastBrand: "",    // zapchast bo'limida marka filtri
  zapchastModel: "",    // zapchast bo'limida model filtri
  zapchastCategory: "", // zapchast kategoriyasi
  isRazborka: false,    // faqat razborka e'lonlari
};

function safeParse(raw, fallback) {
  try { const v = JSON.parse(raw); return v && typeof v === "object" ? v : fallback; } catch { return fallback; }
}

export function MarketProvider({ children }) {
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setFilters((p) => ({ ...p, ...safeParse(raw, {}) }));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(filters)); } catch {}
  }, [filters]);

  // center for nearMe
  useEffect(() => {
    if (filters.center) return;
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setFilters((p) => ({ ...p, center: p.center || { lat: pos.coords.latitude, lng: pos.coords.longitude } })),
      () => {},
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 }
    );
  }, [filters.center]);

  const value = useMemo(() => ({
    filters,
    setFilters,
    patchFilters: (patch) => setFilters((p) => ({ ...p, ...patch })),
    resetFilters: () => setFilters(defaultFilters),
  }), [filters]);

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used inside MarketProvider");
  return ctx;
}
