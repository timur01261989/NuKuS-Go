import React, { useContext, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { IntercityContext } from "../context/IntercityContext";

/**
 * IntercityMap
 * - Works both with provider (full intercity flow) and without provider (small preview).
 *
 * Props:
 * - center: [lat,lng] optional (when provided, component won't require provider data)
 * - small: boolean => use smaller height
 */
export default function IntercityMap({ height = "52vh", center = null, small = false }) {
  const ctx = useContext(IntercityContext);

  const fromLatLng = ctx?.fromCity?.latlng || null;
  const toLatLng = ctx?.toCity?.latlng || null;
  const routeLine = ctx?.routeLine || null;

  const computedCenter = useMemo(() => {
    if (center && Array.isArray(center) && center.length === 2) return center;
    if (fromLatLng) return fromLatLng;
    // Nukus default
    return [42.4602, 59.6156];
  }, [center, fromLatLng]);

  const pin = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  });

  const finalHeight = small ? "160px" : height;

  return (
    <MapContainer center={computedCenter} zoom={10} style={{ height: finalHeight, width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {fromLatLng && <Marker position={fromLatLng} icon={pin} />}
      {toLatLng && <Marker position={toLatLng} icon={pin} />}

      {routeLine && routeLine.length > 1 ? (
        <Polyline positions={routeLine} pathOptions={{ color: "blue", weight: 5 }} />
      ) : null}
    </MapContainer>
  );
}
