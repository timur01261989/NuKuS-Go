import React, { useMemo } from "react";
import { TileLayer } from "react-leaflet";

/**
 * TrafficLayer (Leaflet)
 * Uses a tile URL template provided by env:
 *  - VITE_TRAFFIC_TILE_URL
 *
 * If not set, the layer will not render.
 */
export default function TrafficLayer({ enabled }) {
  const url = useMemo(() => {
    // Vite exposes import.meta.env
    return (import.meta?.env?.VITE_TRAFFIC_TILE_URL || "").trim();
  }, []);

  if (!enabled) return null;
  if (!url) return null; // no provider configured

  return (
    <TileLayer
      url={url}
      opacity={0.85}
      zIndex={500}
      // Many traffic providers require attribution; set it yourself if needed
      attribution=""
    />
  );
}