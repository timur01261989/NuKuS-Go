import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * AiProcessContext: Single source of truth for AI pipeline status
 * status: idle | running | done | error
 */
const AiProcessContext = createContext(null);

const initial = {
  jobId: null,
  status: "idle",
  progress: 0,
  steps: {},   // { studio, damage, recognition, ... }
  result: null,
  error: null,
};

export function AiProcessProvider({ children }) {
  const [state, setState] = useState(initial);

  const value = useMemo(
    () => ({
      state,
      setState,
      reset: () => setState(initial),
    }),
    [state]
  );

  return <AiProcessContext.Provider value={value}>{children}</AiProcessContext.Provider>;
}

export const useAiProcess = () => {
  const ctx = useContext(AiProcessContext);
  if (!ctx) throw new Error("useAiProcess must be used within <AiProcessProvider />");
  return ctx;
};
