import React, { memo, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import LocateButton from "./components/LocateButton";
import { normalizeLatLng } from "./utils/latlng";

function CenterWatcher({ onCenterChange, onMoveStart, onMoveEnd }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return undefined;

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

function CenterSetter({ center, zoom = 15 }) {
  const map = useMap();

  useEffect(() => {
    const c = normalizeLatLng(center);
    if (!map || !c) return;
    map.setView(c, map.getZoom() || zoom, { animate: false });
  }, [map, center, zoom]);

  return null;
}

function TaxiMap({
  mapRef,
  center,
  mapTile,
  step,
  userLoc,
  mapBottom = 240,
  onCenterChange,
  onMoveStart,
  onMoveEnd,
  onRequestLocate,
  routeLine,
  searchingOverlay,
  driverOverlay,
  centerPin,
}) {
  const safeCenter = normalizeLatLng(center) || [42.4602, 59.6137];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
      <MapContainer
        center={safeCenter}
        zoom={15}
        style={{ width: "100%", height: "100%" }}
        whenCreated={(m) => {
          if (mapRef) mapRef.current = m;
        }}
        zoomControl={false}
      >
        <TileLayer url={mapTile} />
        <CenterSetter center={safeCenter} />
        <CenterWatcher
          onCenterChange={onCenterChange}
          onMoveStart={onMoveStart}
          onMoveEnd={onMoveEnd}
        />
        {(step === "route" || step === "coming" || step === "stop_map") && routeLine}
        {searchingOverlay}
        {driverOverlay}
      </MapContainer>

      {centerPin}

      <LocateButton mapRef={mapRef} userLoc={userLoc} bottom={mapBottom} onRequestLocate={onRequestLocate} />
    </div>
  );
}

export default memo(TaxiMap);
