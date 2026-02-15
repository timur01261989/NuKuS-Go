import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CompareContext = createContext(null);
const LS_KEY = "auto_market_compare_v1";
const MAX = 4;

function load() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; } }
function save(v) { try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch {} }

export function CompareProvider({ children }) {
  const [ids, setIds] = useState(load());

  useEffect(() => { save(ids); }, [ids]);

  const value = useMemo(() => ({
    ids,
    has: (id) => ids.includes(String(id)),
    toggle: (id) => setIds((prev) => {
      const key = String(id);
      if (prev.includes(key)) return prev.filter(x => x !== key);
      if (prev.length >= MAX) return prev; // limit
      return [...prev, key];
    }),
    remove: (id) => setIds((prev)=>prev.filter(x=>x!==String(id))),
    clear: () => setIds([]),
    max: MAX,
  }), [ids]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}
