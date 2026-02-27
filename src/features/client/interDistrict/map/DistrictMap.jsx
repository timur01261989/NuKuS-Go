import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useDistrict } from "../context/DistrictContext";

/**
 * DistrictMap.jsx
 * -------------------------------------------------------
 * Marshrutni chizish: Nukus -> tanlangan tuman.
 * Bu interDistrict uchun sodda vizualizatsiya:
 * - A (from) marker
 * - B (to) marker
 * - A-B polyline
 */

const pinIcon = (color = "#1677ff") =>
  L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.25)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

export default function DistrictMap({ from, to }) {
  const { routeInfo } = useDistrict();

  const center = useMemo(() => {
    if (from && to) return [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2];
    if (from) return [from.lat, from.lng];
    return [42.4617, 59.6166];
  }, [from, to]);

  const poly = useMemo(() => {
    if (!from || !to) return null;
    return [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ];
  }, [from, to]);

  const zoom = from && to ? 9 : 11;

  return (
    <div style={{ height: 260, borderRadius: 18, overflow: "hidden", border: "1px solid rgba(0,0,0,.08)" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        {from && <Marker position={[from.lat, from.lng]} icon={pinIcon("#52c41a")} />}
        {to && <Marker position={[to.lat, to.lng]} icon={pinIcon("#ff4d4f")} />}
        {poly && <Polyline positions={poly} pathOptions={{ color: "#52c41a", weight: 4 }} />}
      </MapContainer>

      {!!routeInfo?.distanceKm && (
        <div style={{ padding: "8px 12px", fontSize: 12, color: "#555" }}>
          Masofa: <b>{routeInfo.distanceKm.toFixed(1)} km</b> · Vaqt:{" "}
          <b>{Math.max(1, Math.round(routeInfo.durationMin || 0))} daqiqa</b>
        </div>
      )}
    </div>
  );
}
