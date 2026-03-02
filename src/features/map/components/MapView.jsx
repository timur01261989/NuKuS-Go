import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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
  // ✅ DEBUG: MapView ishlayaptimi? (remove after testing)
  useEffect(() => {
    window.__MAPVIEW_MOUNT_COUNT__ = (window.__MAPVIEW_MOUNT_COUNT__ || 0) + 1;
    console.error("[MAPVIEW] mounted count =", window.__MAPVIEW_MOUNT_COUNT__);
    return () => console.error("[MAPVIEW] unmounted");
  }, []);

  const [routePoints, setRoutePoints] = useState([]);

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

  return (
    <>
      <div style={{position:"fixed",top:8,right:8,zIndex:999999,background:"rgba(255,0,0,0.85)",color:"#fff",padding:"6px 10px",borderRadius:10,fontSize:12,fontWeight:700}}>
        MAPVIEW ACTIVE
      </div>
    <>
      <MapContainer center={userLoc} zoom={16} zoomControl={false} style={{ width: "100%", height: "100%" }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        {!selectingFromMap && <UserMarker position={userLoc} />}

        <MapCenterPicker enabled={selectingFromMap} onPick={onTargetChange} />

        {showRoute && routePoints?.length > 1 ? (
          <RouteLine points={routePoints} />
        ) : null}
      </MapContainer>

      <SearchRadar isVisible={isSearching} />
    </>
  );
}
