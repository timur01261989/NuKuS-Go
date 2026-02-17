import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, message } from "antd";
import { AimOutlined, EnvironmentOutlined, SwapOutlined } from "@ant-design/icons";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useFreightRoute } from "./useFreightRoute";
import { nominatimReverse } from "../services/freightApi";
import { useFreight } from "../context/FreightContext";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

function CenterTracker({ enabled, onCenter, setIsDragging }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    const onMoveStart = () => setIsDragging(true);
    const onMoveEnd = () => {
      setIsDragging(false);
      const c = map.getCenter();
      onCenter([c.lat, c.lng]);
    };
    map.on("movestart", onMoveStart);
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("movestart", onMoveStart);
      map.off("moveend", onMoveEnd);
    };
  }, [enabled, map, onCenter, setIsDragging]);
  return null;
}

// 1. FlyTo funksiyasini to'g'ri varianti
function FlyTo({ target, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target, zoom);
  }, [target, zoom, map]);
  return null;
}

// 2. pinSvg o'zgaruvchisini to'g'ri varianti
const pinSvg = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" fill="#FFD400"/>
    <path d="M36 19c-4 0-7 3-7 7v10l-2 2v3h14v-3l-2-2V26c0-4-3-7-7-7z" fill="#111"/>
  </svg>
);

export default function FreightMap() {
  const { pickup, setPickup, dropoff, setDropoff, setDistanceKm, setDurationMin } = useFreight();

  const [userLoc, setUserLoc] = useState(null);
  const [selecting, setSelecting] = useState("pickup");
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef(null);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  const { routeCoords, distanceKm, durationMin } = useFreightRoute(pickup.latlng, dropoff.latlng);

  useEffect(() => { setDistanceKm(distanceKm); setDurationMin(durationMin); }, [distanceKm, durationMin, setDistanceKm, setDurationMin]);

  const mapCenter = useMemo(() => pickup.latlng || userLoc || [42.46, 59.61], [pickup.latlng, userLoc]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const reverseToAddress = useCallback(async (latlng, which) => {
    if (!latlng) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) { try { abortRef.current.abort(); } catch {} abortRef.current = null; }

    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const addr = await nominatimReverse(latlng[0], latlng[1], ctrl.signal);
        if (ctrl.signal.aborted) return;
        if (which === "pickup") setPickup({ latlng, address: addr || "" });
        if (which === "dropoff") setDropoff({ latlng, address: addr || "" });
      } catch (e) {}
    }, 250);
  }, [setPickup, setDropoff]);

  const handleCenterPicked = useCallback((latlng) => {
    if (!selecting) return;
    reverseToAddress(latlng, selecting);
  }, [selecting, reverseToAddress]);

  const swapPoints = () => { const a = pickup; const b = dropoff; setPickup(b); setDropoff(a); };

  return (
    <div style={{ position: "relative", height: "52vh", borderRadius: 18, overflow: "hidden" }}>
      <MapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }} whenCreated={(m) => (mapRef.current = m)}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        {mapCenter && <FlyTo target={mapCenter} zoom={15} />}
        <CenterTracker enabled={!!selecting} onCenter={handleCenterPicked} setIsDragging={setIsDragging} />
        {pickup.latlng && <Marker position={pickup.latlng} />}
        {dropoff.latlng && <Marker position={dropoff.latlng} />}
        {Array.isArray(routeCoords) && routeCoords.length >= 2 && (
          <Polyline positions={routeCoords} pathOptions={{ color: "#22c55e", weight: 6, opacity: 1 }} />
        )}
      </MapContainer>

     // 118-qatorni mana bunday o'zgartiring:
<div className={`fr-centerpin ${isDragging ? "dragging" : ""}`} aria-hidden>
   <div style={{ width: 70, height: 80 }} dangerouslySetInnerHTML={{ __html: pinSvg() }} />
   <div className="fr-pinlabel">
     {selecting === "pickup" ? "Yuklash joyi" : "Tushirish joyi"}
   </div>
</div>
      )}

      <div style={{ position: "absolute", right: 12, top: 12, zIndex: 800 }}>
        <Button shape="circle" size="large" icon={<AimOutlined />} onClick={() => {
          if (!navigator.geolocation) return message.error("Geolokatsiya yo‘q");
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const p = [pos.coords.latitude, pos.coords.longitude];
              setUserLoc(p);
              mapRef.current?.flyTo(p, 16);
              if (selecting === "pickup") reverseToAddress(p, "pickup");
            },
            () => message.error("Joylashuvni aniqlab bo‘lmadi"),
            { enableHighAccuracy: true, timeout: 8000 }
          );
        }} />
      </div>

      <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, zIndex: 800, display: "flex", gap: 10 }}>
        <Button icon={<EnvironmentOutlined />} onClick={() => setSelecting("pickup")} style={{ flex: 1, borderRadius: 14 }} type={selecting === "pickup" ? "primary" : "default"}>Yuklash</Button>
        <Button icon={<EnvironmentOutlined />} onClick={() => setSelecting("dropoff")} style={{ flex: 1, borderRadius: 14 }} type={selecting === "dropoff" ? "primary" : "default"}>Tushirish</Button>
        <Button icon={<SwapOutlined />} onClick={swapPoints} style={{ borderRadius: 14 }} />
      </div>

      <style>{\`
        .fr-centerpin{position:absolute;left:50%;top:50%;z-index:700;display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:none;transition:transform .2s cubic-bezier(.175,.885,.32,1.275);transform:translate(-50%,-68%);}
        .fr-centerpin.dragging{transform:translate(-50%,-90%) scale(1.15);}
        .fr-pinlabel{background:rgba(17,17,17,.85);color:#fff;padding:6px 10px;border-radius:12px;font-weight:800;font-size:12px;box-shadow:0 10px 24px rgba(0,0,0,.25);transition:opacity .2s;}
        .fr-centerpin.dragging .fr-pinlabel{opacity:.6;}
      \`}</style>
    </div>
  );
}
