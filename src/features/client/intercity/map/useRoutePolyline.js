import { useEffect, useMemo, useRef, useState } from "react";
import { haversineKm } from "../../shared/geo/haversine";
import { osrmRoute } from "../../shared/geo/osrm";



/**
 * useRoutePolyline(fromLatLng, toLatLng)
 * - OSRM orqali marshrut polyline oladi
 * - Agar OSRM ishlamasa, fallback straight-line polyline qaytaradi
 */
export function useRoutePolyline(fromLatLng, toLatLng) {
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMin, setDurationMin] = useState(0);

  const abortRef = useRef(null);

  const key = useMemo(() => {
    if (!fromLatLng || !toLatLng) return "";
    return `${fromLatLng[0].toFixed(5)},${fromLatLng[1].toFixed(5)}-${toLatLng[0].toFixed(5)},${toLatLng[1].toFixed(5)}`;
  }, [fromLatLng, toLatLng]);

  useEffect(() => {
    if (!fromLatLng || !toLatLng) return;

    // Abort old request
    try {
      abortRef.current?.abort?.();
    } catch {}
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);

    (async () => {
      const r = await osrmRoute(fromLatLng, toLatLng, { signal: ac.signal });
      if (ac.signal.aborted) return;

      if (r) {
        setCoords(r.coords);
        setDistanceKm(r.distanceKm);
        setDurationMin(r.durationMin);
      } else {
        const d = haversineKm(fromLatLng, toLatLng);
        setCoords([fromLatLng, toLatLng]);
        setDistanceKm(d);
        setDurationMin(d * 1.6); // taxminiy
      }
    })()
      .catch((e) => {
        if (e?.name !== "AbortError") console.warn(e);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => {
      try {
        ac.abort();
      } catch {}
    };
  }, [key]);

  return { loading, coords, distanceKm, durationMin };
}