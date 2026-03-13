import React, { createContext, useContext, useMemo, useReducer } from "react";
import { DEFAULT_INTEGRATION_STATE, matchingReducer } from "./matchingReducer";

const IntegrationContext = createContext(null);

/**
 * IntegrationProvider
 * Global holat: delivery integration (parcel feed).
 */
export function IntegrationProvider({ initialState, children }) {
  const [state, dispatch] = useReducer(
    matchingReducer,
    { ...DEFAULT_INTEGRATION_STATE, ...(initialState || {}) }
  );

  const api = useMemo(() => ({
    state,
    dispatch,
    setEnabled: (enabled) => dispatch({ type: "SET_ENABLED", enabled }),
    setCapacity: (capacity) => dispatch({ type: "SET_CAPACITY", capacity }),
    setOnlyMyRoute: (onlyMyRoute) => dispatch({ type: "SET_ONLY_MY_ROUTE", onlyMyRoute }),
    setRadiusKm: (radiusKm) => dispatch({ type: "SET_RADIUS", radiusKm }),
    setRoute: (route) => dispatch({ type: "SET_ROUTE", route }),
    setDriverMode: (driverMode) => dispatch({ type: "SET_DRIVER_MODE", driverMode }),
    setOnTrip: (onTrip) => dispatch({ type: "SET_ON_TRIP", onTrip }),
    setParcels: (parcels) => dispatch({ type: "SET_PARCELS", parcels }),
    setFiltered: (filtered) => dispatch({ type: "SET_FILTERED", filtered }),
    setLoading: () => dispatch({ type: "FETCH_START" }),
    setError: (error) => dispatch({ type: "FETCH_ERROR", error }),
    setRealtimeEvent: (event) => dispatch({ type: "REALTIME_EVENT", event }),
  }), [state]);

  return <IntegrationContext.Provider value={api}>{children}</IntegrationContext.Provider>;
}

export function useDeliveryIntegration() {
  const ctx = useContext(IntegrationContext);
  if (!ctx) throw new Error("useDeliveryIntegration() IntegrationProvider ichida ishlatilishi kerak.");
  return ctx;
}
