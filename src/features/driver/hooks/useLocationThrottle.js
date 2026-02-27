import { useRef } from "react";

/**
 * useLocationThrottle
 * Keeps your current logic intact, only prevents sending location too frequently.
 *
 * Default: allow once per 6 seconds.
 */
export function useLocationThrottle(minMs = 6000) {
  const lastRef = useRef(0);

  const canSend = () => {
    const now = Date.now();
    if (now - lastRef.current < minMs) return false;
    lastRef.current = now;
    return true;
  };

  return { canSend };
}
