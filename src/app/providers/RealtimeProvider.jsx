import React, { createContext, useContext, useMemo } from "react";
import * as dispatchRealtime from "@/services/dispatch/dispatchRealtime";

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const value = useMemo(() => ({
    dispatchRealtime,
  }), []);

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error("useRealtimeContext must be used inside RealtimeProvider");
  }
  return ctx;
}
