import React from "react";
import { Outlet } from "react-router-dom";
import MapView from "../components/MapView";

/**
 * MapSingletonLayout
 *
 * NOTE:
 * Some client service pages (Taxi/Intercity/Freight/Delivery) already render their own MapContainer.
 * Rendering an extra MapView (MapContainer) here can trigger Leaflet's:
 *   "Map container is already initialized."
 *
 * So MapView is feature-flagged OFF by default. Enable only if you refactor service pages to reuse MapView.
 *
 * Enable:
 *   VITE_SINGLE_MAP=1 (or "true")
 */
export default function MapSingletonLayout() {
  const SINGLE_MAP =
    String(import.meta?.env?.VITE_SINGLE_MAP || "").toLowerCase() === "1" ||
    String(import.meta?.env?.VITE_SINGLE_MAP || "").toLowerCase() === "true";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {SINGLE_MAP ? <MapView /> : null}

      <div style={{ position: "relative", zIndex: 2, width: "100%", height: "100%" }}>
        <Outlet />
      </div>
    </div>
  );
}
