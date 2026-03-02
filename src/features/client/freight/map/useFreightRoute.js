import { useEffect, useRef, useState } from "react";
import { haversineKm as _haversineKm } from "../../shared/geo/haversine";
import { osrmRoute as _osrmRoute } from "../../shared/geo/osrm";

// Backward-compatible exports (keep old call signatures)
export function haversineKm(a, b) {
  return _haversineKm(a, b);
}

export async function osrmRoute(from, to, signal) {
  return _osrmRoute(from, to, { signal });
}


export function useFreightRoute(pickupLatLng, dropoffLatLng) {
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);

  const abortRef = useRef(null);
  const tRef = useRef(null);

  useEffect(() => {
    if (tRef.current) { clearTimeout(tRef.current); tRef.current = null; }
    if (abortRef.current) { try { abortRef.current.abort(); } catch {} abortRef.current = null; }

    if (!pickupLatLng || !dropoffLatLng) {
      setRouteCoords([]);
      setDistanceKm(null);
      setDurationMin(null);
      return;
    }

    const from = pickupLatLng;
    const to = dropoffLatLng;

    setRouteCoords([from, to]);
    // Fallback distance (OSRM ishlamasa ham masofa ko'rinsin)
    try { setDistanceKm(_haversineKm(from, to)); } catch { setDistanceKm(null); }

    tRef.current = setTimeout(() => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      (async () => {
        const r = await osrmRoute(from, to, ctrl.signal);
        if (ctrl.signal.aborted) return;
        setRouteCoords(Array.isArray(r?.coords) ? r.coords : [from, to]);
        setDistanceKm(Number.isFinite(r?.distanceKm) ? r.distanceKm : null);
        setDurationMin(Number.isFinite(r?.durationMin) ? r.durationMin : null);
      })().catch(() => {
        try { setDistanceKm(_haversineKm(from, to)); } catch { setDistanceKm(null); }
      });
    }, 250);

    return () => {
      if (tRef.current) { clearTimeout(tRef.current); tRef.current = null; }
      if (abortRef.current) { try { abortRef.current.abort(); } catch {} abortRef.current = null; }
    };
  }, [pickupLatLng, dropoffLatLng]);

  return { routeCoords, distanceKm, durationMin };
}