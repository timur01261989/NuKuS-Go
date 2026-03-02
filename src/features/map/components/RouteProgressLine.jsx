// src/features/map/components/RouteProgressLine.jsx
import React from "react";
import { Polyline } from "react-leaflet";

/**
 * RouteProgressLine
 * Splits route into completed (0..progressIndex) and remaining (progressIndex..end).
 * points: [ [lng,lat], ... ]  (same as your current buildRoute output)
 */
export default function RouteProgressLine({ points, progressIndex=0 }) {
  if (!Array.isArray(points) || points.length < 2) return null;
  const latlng = points.map((c) => [Number(c[1]), Number(c[0])]).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));

  const idx = Math.max(0, Math.min(latlng.length - 1, Number(progressIndex) || 0));
  const done = latlng.slice(0, idx + 1);
  const left = latlng.slice(idx);

  return (
    <>
      {done.length > 1 ? <Polyline positions={done} pathOptions={{ weight: 6, opacity: 0.35 }} /> : null}
      {left.length > 1 ? <Polyline positions={left} pathOptions={{ weight: 6, opacity: 0.9 }} /> : null}
    </>
  );
}