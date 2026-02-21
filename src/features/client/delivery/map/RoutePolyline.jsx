import React, { useEffect, useMemo, useRef, useState } from "react";
import { Polyline, useMap } from "react-leaflet";

function haversineKm(a, b) {
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

async function osrmRoute(from, to, signal) {
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
    if (e?.name !== "AbortError") console.warn("OSRM route xato:", e);
  }
  const km = haversineKm(from, to);
  return { coords: [from, to], distanceKm: km, durationMin: km * 2 };
}

export default function RoutePolyline({ from, to, onMeta }) {
  const map = useMap();
  const [coords, setCoords] = useState([]);
  const abortRef = useRef(null);

  useEffect(() => {
    if (abortRef.current) { try { abortRef.current.abort(); } catch {} abortRef.current = null; }
    if (!from || !to) { setCoords([]); onMeta?.({ distanceKm: 0, durationMin: 0 }); return; }

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      const r = await osrmRoute(from, to, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setCoords(r.coords || [from, to]);
      onMeta?.({ distanceKm: r.distanceKm || 0, durationMin: r.durationMin || 0 });

      // Fit with padding (bottom sheet)
      try {
        const bounds = (window.L || null) ? window.L.latLngBounds(r.coords) : null;
        if (bounds) map.fitBounds(bounds, { paddingTopLeft: [40, 40], paddingBottomRight: [40, 320] });
      } catch {}
    })();

    return () => { try { ctrl.abort(); } catch {} };
  }, [from, to, map, onMeta]);

  if (!coords || coords.length < 2) return null;

  return <Polyline positions={coords} pathOptions={{ color: "#22c55e", weight: 6, opacity: 1 }} />;
}
