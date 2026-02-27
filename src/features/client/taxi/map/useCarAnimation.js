import { useEffect, useRef, useState } from "react";

/**
 * Smoothly interpolate from prev->next for marker position.
 * Returns animated position.
 */
export default function useCarAnimation(position, durationMs = 600) {
  const [animated, setAnimated] = useState(position);
  const prevRef = useRef(position);

  useEffect(() => {
    const from = prevRef.current;
    const to = position;
    if (!from || !to) {
      prevRef.current = to;
      setAnimated(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / durationMs);
      const lat = from[0] + (to[0] - from[0]) * p;
      const lng = from[1] + (to[1] - from[1]) * p;
      setAnimated([lat, lng]);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [position?.[0], position?.[1], durationMs]);

  return animated;
}
