import React, { useMemo } from "react";
import { useMap } from "react-leaflet";

/**
 * MapRightControls
 * - Recenter to user location
 * - Toggle traffic overlay
 * - Toggle parking POIs
 *
 * This mimics the UX of Yandex-style right controls (original implementation).
 */
export default function MapRightControls({
  userLoc,
  trafficOn,
  parkingOn,
  onToggleTraffic,
  onToggleParking,
}) {
  const map = useMap();

  const canRecenter = useMemo(() => {
    return !!(userLoc && Number.isFinite(Number(userLoc.lat)) && Number.isFinite(Number(userLoc.lng)));
  }, [userLoc?.lat, userLoc?.lng]);

  function recenter() {
    if (!canRecenter) return;
    map.setView([Number(userLoc.lat), Number(userLoc.lng)], Math.max(map.getZoom(), 16), { animate: true });
  }

  // Simple inline styles; you can swap to your design system later
  const btn = (active) => ({
    width: 46,
    height: 46,
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.1)",
    background: active ? "rgba(0,0,0,0.85)" : "white",
    color: active ? "white" : "black",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    cursor: "pointer",
    userSelect: "none",
  });

  return (
    <div
      style={{
        position: "absolute",
        right: 14,
        top: 18,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Recenter / "my location" */}
      <div onClick={recenter} title="Joyimga qaytish" style={btn(false)}>
        {/* simple compass-like icon */}
        <span style={{ fontSize: 18, lineHeight: 1 }}>◎</span>
      </div>

      {/* Parking toggle */}
      <div
        onClick={typeof onToggleParking === "function" ? onToggleParking : undefined}
        title="Parking"
        style={btn(!!parkingOn)}
      >
        <span style={{ fontWeight: 800 }}>P</span>
      </div>

      {/* Traffic toggle */}
      <div
        onClick={typeof onToggleTraffic === "function" ? onToggleTraffic : undefined}
        title="Traffic"
        style={btn(!!trafficOn)}
      >
        {/* traffic icon */}
        <span style={{ fontSize: 18, lineHeight: 1 }}>≋</span>
      </div>
    </div>
  );
}