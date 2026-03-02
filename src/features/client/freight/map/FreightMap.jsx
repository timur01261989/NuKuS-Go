import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, message } from "antd";
import { AimOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useFreightRoute } from "./useFreightRoute";
import { nominatimReverse } from "../services/freightApi";
import { useFreight } from "../context/FreightContext";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet marker icon fix
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

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

function FlyTo({ target, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target, zoom, { animate: true, duration: 1.2 });
  }, [target, zoom, map]);
  return null;
}

function MapClickPick({ enabled, onPick }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// SVG center pin (selection mode)
const pinSvg = () => `
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="20" fill="#FFD400"/>
  <path d="M36 19c-4 0-7 3-7 7v10l-2 2v3h14v-3l-2-2V26c0-4-3-7-7-7z" fill="#111"/>
</svg>`;

export default function FreightMap() {
  const { pickup, setPickup, dropoff, setDropoff, selecting, setSelecting, setDistanceKm, setDurationMin } = useFreight();

  const [userLoc, setUserLoc] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef(null);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  const { routeCoords, distanceKm, durationMin } = useFreightRoute(pickup?.latlng || null, dropoff?.latlng || null);

  useEffect(() => {
    if (distanceKm) setDistanceKm(distanceKm);
    if (durationMin) setDurationMin(durationMin);
  }, [distanceKm, durationMin, setDistanceKm, setDurationMin]);

  const defaultCenter = [42.46, 59.61]; // Nukus
  const mapCenter = useMemo(() => {
    if (selecting === "pickup" && pickup?.latlng) return pickup.latlng;
    if (selecting === "dropoff" && dropoff?.latlng) return dropoff.latlng;
    if (pickup?.latlng) return pickup.latlng;
    if (userLoc) return userLoc;
    return defaultCenter;
  }, [pickup?.latlng, dropoff?.latlng, selecting, userLoc]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const reverseToAddress = useCallback(
    async (latlng, which) => {
      if (!latlng) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
        abortRef.current = null;
      }

      debounceRef.current = setTimeout(async () => {
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        try {
          const addr = await nominatimReverse(latlng[0], latlng[1], ctrl.signal);
          if (ctrl.signal.aborted) return;

          if (which === "pickup") setPickup((prev) => ({ ...prev, latlng, address: addr || "" }));
          if (which === "dropoff") setDropoff((prev) => ({ ...prev, latlng, address: addr || "" }));
        } catch {
          // ignore
        }
      }, 220);
    },
    [setPickup, setDropoff]
  );

  const handleCenterPicked = useCallback(
    (latlng) => {
      if (!selecting) return;
      reverseToAddress(latlng, selecting);
    },
    [selecting, reverseToAddress]
  );

  const handleTapPicked = useCallback(
    (latlng) => {
      if (!selecting) return;
      // move map to tapped location, then reverse it
      mapRef.current?.flyTo(latlng, 16);
      reverseToAddress(latlng, selecting);
    },
    [selecting, reverseToAddress]
  );

  const handleLocateMe = () => {
    if (!navigator.geolocation) return message.error("Geolokatsiya yo‘q");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(p);
        mapRef.current?.flyTo(p, 16);
        if (selecting) reverseToAddress(p, selecting);
      },
      () => message.error("Joylashuvni aniqlab bo‘lmadi"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const height = selecting ? "52vh" : 220;

  return (
    <div style={{ position: "relative", height, borderRadius: 18, overflow: "hidden" }}>
      <MapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }} whenCreated={(m) => (mapRef.current = m)}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        <FlyTo target={mapCenter} zoom={selecting ? 16 : 13} />

        <CenterTracker enabled={!!selecting} onCenter={handleCenterPicked} setIsDragging={setIsDragging} />
        <MapClickPick enabled={!!selecting} onPick={handleTapPicked} />

        {pickup?.latlng && <Marker position={pickup.latlng} />}
        {dropoff?.latlng && <Marker position={dropoff.latlng} />}

        {Array.isArray(routeCoords) && routeCoords.length >= 2 && <Polyline positions={routeCoords} pathOptions={{ color: "#22c55e", weight: 6, opacity: 1 }} />}
      </MapContainer>

      {/* center pin when selecting */}
      {selecting && (
        <div className={`fr-centerpin ${isDragging ? "dragging" : ""}`} aria-hidden="true">
          <div style={{ width: 70, height: 80 }} dangerouslySetInnerHTML={{ __html: pinSvg() }} />
          <div className="fr-pinlabel">{selecting === "pickup" ? "Yuborish (yuklash) manzili" : "Tushirish (yetkazish) manzili"}</div>
        </div>
      )}

      {/* locate button */}
      <div style={{ position: "absolute", right: 12, top: 12, zIndex: 800 }}>
        <Button shape="circle" size="large" icon={<AimOutlined />} onClick={handleLocateMe} />
      </div>

      {/* save/cancel panel when selecting */}
      {selecting && (
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, zIndex: 900, display: "flex", gap: 10 }}>
          <Button
            icon={<CloseOutlined />}
            onClick={() => setSelecting(null)}
            style={{ borderRadius: 14 }}
          >
            Bekor
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => setSelecting(null)}
            style={{ flex: 1, borderRadius: 14 }}
          >
            Manzilni saqlash
          </Button>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .fr-centerpin {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 850;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          pointer-events: none;
          transition: transform .2s cubic-bezier(.175,.885,.32,1.275);
          transform: translate(-50%, -68%);
        }
        .fr-centerpin.dragging {
          transform: translate(-50%, -90%) scale(1.15);
        }
        .fr-pinlabel {
          background: rgba(0,0,0,.75);
          color: white;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }
      `,
        }}
      />
    </div>
  );
}
