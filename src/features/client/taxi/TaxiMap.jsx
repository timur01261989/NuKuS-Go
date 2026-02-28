import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import LocateButton from "./components/LocateButton";

/**
 * TaxiMap
 * - Wraps react-leaflet MapContainer
 * - Emits center changes + drag state
 * - Renders injected overlays (route/driver/searching) and center pin
 */
function CenterWatcher({ onCenterChange, onMoveStart, onMoveEnd }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const fire = () => {
      const c = map.getCenter();
      onCenterChange?.([c.lat, c.lng], map.getZoom());
    };

    const ms = () => onMoveStart?.();
    const me = () => {
      onMoveEnd?.();
      fire();
    };

    map.on("movestart", ms);
    map.on("moveend", me);
    map.on("zoomend", me);

    fire();

    return () => {
      map.off("movestart", ms);
      map.off("moveend", me);
      map.off("zoomend", me);
    };
  }, [map, onCenterChange, onMoveStart, onMoveEnd]);

  return null;
}

export default function TaxiMap({
  mapRef,
  center,
  mapTile,
  step,
  userLoc,
  onRequestLocate,
  mapBottom = 240,
  onCenterChange,
  onMoveStart,
  onMoveEnd,
  routeLine,
  searchingOverlay,
  driverOverlay,
  centerPin,
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
      <MapContainer
        key={`client-taxi-${center?.[0] ?? 0}-${center?.[1] ?? 0}`}
        center={center}
        zoom={15}
        style={{ width: "100%", height: "100%" }}
        whenCreated={(m) => {
          if (mapRef) mapRef.current = m;
        }}
        zoomControl={false}
      >
        <TileLayer url={mapTile} />

        <CenterWatcher
          onCenterChange={onCenterChange}
          onMoveStart={onMoveStart}
          onMoveEnd={onMoveEnd}
        />

        {(step === "route" || step === "coming") && routeLine}

        {searchingOverlay}

        {driverOverlay}
      </MapContainer>

      {centerPin}

      <LocateButton mapRef={mapRef} userLoc={userLoc} onRequestLocate={onRequestLocate} bottom={mapBottom} />
    </div>
  );
}
