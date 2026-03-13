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
  // ✅ DEBUG: mount/unmount check (remove after testing)
  useEffect(() => {
    window.__MAPVIEW_MOUNT_COUNT__ = (window.__MAPVIEW_MOUNT_COUNT__ || 0) + 1;
    console.warn("[MAPVIEW][MOUNT] count =", window.__MAPVIEW_MOUNT_COUNT__);
    return () => console.warn("[MAPVIEW][UNMOUNT]");
  }, []);
  // 👆 SHU YER: MapView qayta mount bo‘lsa count oshadi

  const [routePoints, setRoutePoints] = useState([]);

  // Map layers toggles
  const [showTraffic, setShowTraffic] = useState(false);
  const [showParking, setShowParking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!showRoute) {
        setRoutePoints([]);
        if (typeof onRouteDistanceMeters === "function") onRouteDistanceMeters(0);
        return;
      }
      if (!userLoc?.lat || !userLoc?.lng || !targetLoc?.lat || !targetLoc?.lng) return;

      try {
        const r = await buildRoute({ pickup: userLoc, dropoff: targetLoc });
        if (cancelled) return;

        const coords = r?.coordinates || r?.geometry?.coordinates || [];
        setRoutePoints(coords);

        if (typeof onRouteDistanceMeters === "function") {
          onRouteDistanceMeters(Number(r?.distance_m || 0));
        }
      } catch (e) {
        if (!cancelled) {
          setRoutePoints([]);
          if (typeof onRouteDistanceMeters === "function") onRouteDistanceMeters(0);
          // console.warn("Route build failed:", e);
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, [showRoute, userLoc?.lat, userLoc?.lng, targetLoc?.lat, targetLoc?.lng, onRouteDistanceMeters]);

  const fallbackCenter = { lat: 42.46, lng: 59.61 }; // Nukus (fallback)
  const safeCenter = userLoc?.lat && userLoc?.lng ? userLoc : fallbackCenter;

  return (
    <>
      <MapContainer center={safeCenter} zoom={16} zoomControl={false} style={{ width: "100%", height: "100%" }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

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
          userLoc={safeCenter}
        />
      </MapContainer>

      <SearchRadar isVisible={isSearching} />
    </>
  );
}
