import { useEffect, useRef, useState } from "react";

export function haversineKm(a, b) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(s1 + Math.cos(lat1) * Math.cos(lat2) * s2)));
  return R * c;
}

export async function osrmRoute(from, to, signal) {
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
    if (e?.name !== "AbortError") console.warn("OSRM xatolik:", e);
  }
  const approx = haversineKm(from, to);
  return { coords: [from, to], distanceKm: approx, durationMin: approx * 2 };
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

    tRef.current = setTimeout(() => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      (async () => {
        const r = await osrmRoute(from, to, ctrl.signal);
        if (ctrl.signal.aborted) return;
        setRouteCoords(Array.isArray(r?.coords) ? r.coords : [from, to]);
        setDistanceKm(Number.isFinite(r?.distanceKm) ? r.distanceKm : null);
        setDurationMin(Number.isFinite(r?.durationMin) ? r.durationMin : null);
      })().catch(() => {});
    }, 250);

    return () => {
      if (tRef.current) { clearTimeout(tRef.current); tRef.current = null; }
      if (abortRef.current) { try { abortRef.current.abort(); } catch {} abortRef.current = null; }
    };
  }, [pickupLatLng, dropoffLatLng]);

  return { routeCoords, distanceKm, durationMin };
}
