// src/features/map/hooks/useDriverSmoother.js
import { useRef } from "react";

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function distMeters(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180;
  const la2 = b.lat * Math.PI / 180;
  const s = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * useDriverSmoother
 * Filters GPS jitter and prevents "teleport" spikes.
 * - alpha: smoothing factor (0.2..0.6)
 * - maxJumpMeters: ignore jumps larger than this unless repeated
 */
export default function useDriverSmoother({ alpha=0.35, maxJumpMeters=150 } = {}) {
  const prevRef = useRef(null);
  const badRef = useRef(0);

  return function smooth(point) {
    if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return prevRef.current || point;

    const prev = prevRef.current;
    if (!prev) {
      prevRef.current = { lat: Number(point.lat), lng: Number(point.lng), bearing: point.bearing, speed: point.speed };
      return prevRef.current;
    }

    const d = distMeters(prev, point);
    if (d > maxJumpMeters) {
      badRef.current += 1;
      // ignore single spike
      if (badRef.current < 2) return prev;
    } else {
      badRef.current = 0;
    }

    const a = clamp(alpha, 0.05, 0.9);
    const out = {
      lat: prev.lat + (Number(point.lat) - prev.lat) * a,
      lng: prev.lng + (Number(point.lng) - prev.lng) * a,
      bearing: point.bearing ?? prev.bearing,
      speed: point.speed ?? prev.speed,
    };
    prevRef.current = out;
    return out;
  };
}