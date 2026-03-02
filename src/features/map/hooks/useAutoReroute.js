// src/features/map/hooks/useAutoReroute.js
import { useEffect, useRef } from "react";
import { buildRoute } from "../../../providers/route/index.js";

function distMetersApprox(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180;
  const la2 = b.lat * Math.PI / 180;
  const s = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * useAutoReroute
 * If current position deviates from last route's start/nearby points by threshold, refresh route.
 * This is a lightweight heuristic (not full map matching).
 */
export default function useAutoReroute({
  enabled,
  pickup,
  dropoff,
  current,
  routeLatLng,          // [ [lat,lng], ... ]
  thresholdMeters = 80,
  cooldownMs = 12000,
  onRoute,              // (route) => void
}) {
  const lastRunRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (!pickup || !dropoff || !current) return;
    if (!Number.isFinite(current.lat) || !Number.isFinite(current.lng)) return;

    const now = Date.now();
    if (now - lastRunRef.current < cooldownMs) return;

    // quick check: compare current to pickup if we don't have route yet
    if (!Array.isArray(routeLatLng) || routeLatLng.length < 2) {
      const d = distMetersApprox(pickup, current);
      if (d > thresholdMeters) {
        lastRunRef.current = now;
        (async () => {
          const r = await buildRoute({ pickup: current, dropoff });
          onRoute?.(r);
        })().catch(() => {});
      }
      return;
    }

    // compare current to the nearest of first N points
    const N = Math.min(40, routeLatLng.length);
    let best = Infinity;
    for (let i=0;i<N;i++) {
      const p = { lat: Number(routeLatLng[i][0]), lng: Number(routeLatLng[i][1]) };
      const d = distMetersApprox(p, current);
      if (d < best) best = d;
    }

    if (best > thresholdMeters) {
      lastRunRef.current = now;
      (async () => {
        const r = await buildRoute({ pickup: current, dropoff });
        onRoute?.(r);
      })().catch(() => {});
    }
  }, [
    enabled,
    pickup?.lat, pickup?.lng,
    dropoff?.lat, dropoff?.lng,
    current?.lat, current?.lng,
    thresholdMeters, cooldownMs,
    onRoute,
    // routeLatLng is an array; avoid deep deps; caller can memoize
  ]);
}