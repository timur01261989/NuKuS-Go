import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import MapRightControls from "../controls/MapRightControls.jsx";
import TrafficLayer from "../layers/TrafficLayer.jsx";
import ParkingLayer from "../layers/ParkingLayer.jsx";

import UserMarker from "./UserMarker";
import MapCenterPicker from "./MapCenterPicker";
import SearchRadar from "./SearchRadar";
import RouteLine from "./RouteLine";
import { buildRoute } from "../../../providers/route/index.js";

export default function MapView({
  userLoc,
  targetLoc,
  selectingFromMap,
  onTargetChange,
  showRoute,
  onRouteDistanceMeters,
  isSearching
}) {
  
  const [showTraffic, setShowTraffic] = useState(false);
  const [showParking, setShowParking] = useState(false);

  // ✅ DEBUG: mount/unmount check (remove after testing)
  useEffect(() => {
    window.__MAPVIEW_MOUNT_COUNT__ = (window.__MAPVIEW_MOUNT_COUNT__ || 0) + 1;
    console.warn("[MAPVIEW][MOUNT] count =", window.__MAPVIEW_MOUNT_COUNT__);
    
  const fallbackCenter = { lat: 42.4600, lng: 59.6100 }; // Nukus (fallback)

  const safeCenter = userLoc?.lat && userLoc?.lng ? userLoc : fallbackCenter;

  return (
    <>
      <MapContainer
        center={safeCenter}
        zoom={16}
        zoomControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <TrafficLayer enabled={showTraffic} />
        <ParkingLayer enabled={showParking} />

        {!selectingFromMap && userLoc?.lat && userLoc?.lng ? (
          <UserMarker position={userLoc} />
        ) : null}

        <MapCenterPicker enabled={selectingFromMap} onPick={onTargetChange} />

        {showRoute && routePoints?.length > 1 ? (
          <RouteLine points={routePoints} />
        ) : null}

        <MapRightControls
          trafficOn={showTraffic}
          parkingOn={showParking}
          onToggleTraffic={() => setShowTraffic((v) => !v)}
          onToggleParking={() => setShowParking((v) => !v)}
          userLoc={userLoc}
        />
      </MapContainer>

      <SearchRadar isVisible={isSearching} />
    </>
  );
}
