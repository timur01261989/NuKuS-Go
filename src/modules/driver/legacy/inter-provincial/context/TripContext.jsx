import React, { createContext, useContext, useMemo, useReducer } from "react";
import { initialTripState, tripReducer } from "./tripReducer";

const TripContext = createContext(null);

export function TripProvider({ children }) {
  const [state, dispatch] = useReducer(tripReducer, initialTripState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used inside TripProvider");
  return ctx;
}
