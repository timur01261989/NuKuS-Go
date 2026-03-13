import { useMemo, useRef } from 'react';
import { useDriverLocationRealtime } from './useDriverLocationRealtime.js';
import { smoothPoint } from '../utils/locationSmoothing.js';

export function useDriverLocationSmoothed(orderId, alpha = 0.35) {
  const { location, lastPayload } = useDriverLocationRealtime(orderId);
  const prevRef = useRef(null);

  const smoothed = useMemo(() => {
    if (!location) return null;
    const next = { ...location };
    const out = smoothPoint(prevRef.current, next, alpha);
    prevRef.current = out;
    return out;
  }, [location, alpha]);

  return { location: smoothed, lastPayload };
}
