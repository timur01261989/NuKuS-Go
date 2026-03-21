import React, { createContext, useContext, useMemo } from "react";
import * as dispatchApi from "@/services/dispatch/dispatchApi";
import * as dispatchRealtime from "@/services/dispatch/dispatchRealtime";

const DispatchContext = createContext(null);

export function DispatchProvider({ children }) {
  const value = useMemo(() => ({
    api: dispatchApi,
    realtime: dispatchRealtime,
  }), []);

  return (
    <DispatchContext.Provider value={value}>
      {children}
    </DispatchContext.Provider>
  );
}

export function useDispatch() {
  const ctx = useContext(DispatchContext);
  if (!ctx) {
    throw new Error("useDispatch must be used inside DispatchProvider");
  }
  return ctx;
}
