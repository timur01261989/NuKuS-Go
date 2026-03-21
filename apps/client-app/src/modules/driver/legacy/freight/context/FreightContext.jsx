import React, { createContext, useContext, useMemo, useReducer } from "react";
import { freightReducer, initialFreightState } from "./freightReducer";

const FreightCtx = createContext(null);

export function FreightProvider({ children }) {
  const [state, dispatch] = useReducer(freightReducer, initialFreightState);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <FreightCtx.Provider value={value}>{children}</FreightCtx.Provider>;
}

export function useFreight() {
  const ctx = useContext(FreightCtx);
  if (!ctx) throw new Error("useFreight must be used inside <FreightProvider />");
  return ctx;
}
