import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import UserMarker from "./UserMarker";
import MapCenterPicker from "./MapCenterPicker";
import RoutingMachine from "./RoutingMachine";

// agar sizda SearchRadar eski joyda bo‘lsa yo‘lini moslang:
import SearchRadar from "../../../components/map/SearchRadar"; 
// agar endi ham features ichiga ko‘chirsangiz:
// import SearchRadar from "../components/SearchRadar";

export default function MapView({
  userLoc,
  targetLoc,
  selectingFromMap,
  onTargetChange,
  showRoute,
  onRouteDistanceMeters,
  isSearching
}) {
  return (
    <>
      <MapContainer center={userLoc} zoom={16} zoomControl={false} style={{ width: "100%", height: "100%" }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        {!selectingFromMap && <UserMarker position={userLoc} />}

        <MapCenterPicker enabled={selectingFromMap} onPick={onTargetChange} />

        {showRoute && (
          <RoutingMachine from={userLoc} to={targetLoc} onDistanceMeters={onRouteDistanceMeters} />
        )}
      </MapContainer>

      <SearchRadar isVisible={isSearching} />
    </>
  );
}
