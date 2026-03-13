import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useTaxi } from "../../context/TaxiProvider";
import MapMarkers from "./MapMarkers";
import { buildPolyline } from "../../utils/geo";

function MapFlyController() {
  const map = useMap();
  const { state, dispatch } = useTaxi();

  useEffect(() => {
    if (state.map.flyToDriver && state.driverLocation?.latlng) {
      map.flyTo(state.driverLocation.latlng, 16, { duration: 0.6 });
      dispatch({ type: "map/consumeFlyToDriver" });
    }
  }, [state.map.flyToDriver, state.driverLocation?.latlng, map, dispatch]);

  useEffect(() => {
    // Active order bo‘lsa, marshrutni sig‘dirib qo‘yish (panel uchun pastdan padding)
    const o = state.activeOrder;
    if (!o) return;

    const from = o.pickup_lat && o.pickup_lng ? [o.pickup_lat, o.pickup_lng] : null;
    const to = o.dropoff_lat && o.dropoff_lng ? [o.dropoff_lat, o.dropoff_lng] : null;
    if (!from || !to) return;

    const bounds = L.latLngBounds(from, to);
    map.fitBounds(bounds, { paddingTopLeft: [40, 40], paddingBottomRight: [40, 260] });
  }, [state.activeOrder?.id, state.activeOrder?.pickup_lat, state.activeOrder?.pickup_lng, state.activeOrder?.dropoff_lat, state.activeOrder?.dropoff_lng, map]);

  return null;
}

export default function TaxiMap() {
  const { state } = useTaxi();
  const center = state.driverLocation?.latlng || [42.4602, 59.6166]; // Nukus default

  const isNight = useMemo(() => document.body.classList.contains("night-mode-active"), []);

  return (
    <div className="citytaxi-map-wrap">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        <TileLayer
          url={
            isNight
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          }
        />
        <MapFlyController />
        <MapMarkers />
      </MapContainer>
    </div>
  );
}
