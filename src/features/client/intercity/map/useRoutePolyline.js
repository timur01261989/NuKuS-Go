import { useEffect, useMemo, useRef, useState } from "react";

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

async function osrmRoute(from, to, signal) {
  // OSRM yo'nalish topa olmasa ham xato bermaslik uchun
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal });
    const data = await res.json();
    const r = data?.routes?.[0];
    if (r) {
      return {
        coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distanceKm: (r.distance || 0) / 1000,
        durationMin: (r.duration || 0) / 60,
      };
    }
  } catch (e) {
    if (e?.name === "AbortError") return null;
    console.warn("OSRM yo'nalish chizishda xatolik:", e);
  }
  return null;
}

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
      const r = await osrmRoute(fromLatLng, toLatLng, ac.signal);
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
