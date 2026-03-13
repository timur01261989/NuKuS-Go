import React, { useEffect, useMemo, useRef, useState } from "react";
import { Polyline, useMap } from "react-leaflet";
import { haversineKm } from "../../shared/geo/haversine";
import { osrmRoute } from "../../shared/geo/osrmClient";



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
      const r = await osrmRoute(from, to, { signal: ctrl.signal });
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