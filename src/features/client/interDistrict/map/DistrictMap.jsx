import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * DistrictMap.jsx (Client)
 * -------------------------------------------------------
 * - A (from) marker
 * - B (to) marker
 * - OSRM polyline (yo‘l bo‘ylab)
 *
 * Eslatma: zoom "sakrab ketmasin" uchun doimiy qiymatlar ishlatiladi.
 */

const pinIcon = (color = "#1677ff") =>
  L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.25)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

export default function DistrictMap({ from, to, polyline, distanceKm, durationMin }) {
  const center = useMemo(() => {
    if (from && to) return [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2];
    if (from) return [from.lat, from.lng];
    return [41.311, 69.2797]; // default (Toshkent)
  }, [from, to]);

  const zoom = useMemo(() => {
    if (from && to) return 9;
    return 11;
  }, [from, to]);

  return (
    <div style={{ height: 240, borderRadius: 18, overflow: "hidden", border: "1px solid rgba(0,0,0,.08)" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        {from && <Marker position={[from.lat, from.lng]} icon={pinIcon("#1677ff")} />}
        {to && <Marker position={[to.lat, to.lng]} icon={pinIcon("#52c41a")} />}
        {polyline && polyline.length > 1 && <Polyline positions={polyline} pathOptions={{ color: "#1677ff", weight: 4 }} />}
      </MapContainer>

      {!!distanceKm && (
        <div style={{ padding: "8px 12px", fontSize: 12, color: "#555" }}>
          Masofa: <b>{distanceKm.toFixed(1)} km</b> · Vaqt: <b>{Math.max(1, Math.round(durationMin || 0))} daqiqa</b>
        </div>
      )}
    </div>
  );
}
