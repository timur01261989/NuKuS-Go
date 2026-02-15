
import React, { createContext, useContext, useMemo, useState } from "react";

const MarketFilterContext = createContext(null);

const defaultFilters = {
  q: "",
  city: "",
  brand: "",
  minPrice: "",
  maxPrice: "",
  yearFrom: "",
  yearTo: "",
  exchange: false,
  kredit: false,
  sort: "recent",
};

export function MarketFilterProvider({ children }) {
  const [filters, setFilters] = useState(defaultFilters);

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      resetFilters: () => setFilters(defaultFilters),
      patchFilters: (patch) => setFilters((p) => ({ ...p, ...patch })),
    }),
    [filters]
  );

  return <MarketFilterContext.Provider value={value}>{children}</MarketFilterContext.Provider>;
}

export function useMarketFilters() {
  const ctx = useContext(MarketFilterContext);
  if (!ctx) throw new Error("useMarketFilters must be used inside MarketFilterProvider");
  return ctx;
}
