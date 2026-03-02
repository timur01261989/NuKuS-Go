import React from "react";
import { Outlet } from "react-router-dom";
import MapView from "../components/MapView";

/**
 * MapSingletonLayout
 * Keeps MapView mounted while switching between service pages (instant navigation).
 *
 * Use this as a parent route element, and put service routes under it.
 */
export default function MapSingletonLayout() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MapView />
      <div style={{ position: "relative", zIndex: 2 }}>
        <Outlet />
      </div>
    </div>
  );
}
