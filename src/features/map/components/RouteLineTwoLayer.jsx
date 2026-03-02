import React from "react";
import { Polyline } from "react-leaflet";

/**
 * RouteLineTwoLayer
 * Draws a "shadow" line under the main route line to improve readability,
 * similar to premium navigation apps (original implementation).
 *
 * points: array of [lat, lng] or [lng, lat] depending on your route provider.
 * This component expects [lng, lat] and converts to [lat, lng] (matches your current MapView buildRoute usage).
 */
export default function RouteLineTwoLayer({ points }) {
  if (!Array.isArray(points) || points.length < 2) return null;
  const latlng = points.map((c) => [Number(c[1]), Number(c[0])]).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));

  return (
    <>
      <Polyline positions={latlng} pathOptions={{ weight: 10, opacity: 0.35 }} />
      <Polyline positions={latlng} pathOptions={{ weight: 6, opacity: 0.9 }} />
    </>
  );
}