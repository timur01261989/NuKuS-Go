import React, { createContext, useContext, useMemo, useReducer } from "react";
import { initialTaxiState, taxiReducer } from "./taxiReducer";

const TaxiCtx = createContext(null);

/**
 * TaxiProvider.jsx
 * - state + dispatch ni hamma komponentlarga tarqatadi
 */
export function TaxiProvider({ children }) {
  const [state, dispatch] = useReducer(taxiReducer, initialTaxiState);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <TaxiCtx.Provider value={value}>{children}</TaxiCtx.Provider>;
}

export function useTaxi() {
  const v = useContext(TaxiCtx);
  if (!v) throw new Error("useTaxi must be used inside TaxiProvider");
  return v;
}
