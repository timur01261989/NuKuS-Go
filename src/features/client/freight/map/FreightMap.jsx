import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, message } from "antd";
import { AimOutlined, EnvironmentOutlined, SwapOutlined } from "@ant-design/icons";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useFreightRoute } from "./useFreightRoute";
import { nominatimReverse } from "../services/freightApi";
import { useFreight } from "../context/FreightContext";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Marker iconlarini to'g'irlash
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


function ClickPicker({ enabled, onPick }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      const { lat, lng } = e.latlng || {};
      if (typeof lat === "number" && typeof lng === "number") onPick([lat, lng]);
    }
  });
  return null;
}

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
    map.flyTo(target, zoom, { animate: true, duration: 1.5 });
  }, [target, zoom, map]);
  return null;
}

// SVG string ko'rinishida (dangerouslySetInnerHTML uchun)
const pinSvg = () => `
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="20" fill="#FFD400"/>
  <path d="M36 19c-4 0-7 3-7 7v10l-2 2v3h14v-3l-2-2V26c0-4-3-7-7-7z" fill="#111"/>
</svg>`;

export default function FreightMap() {
  const { pickup, setPickup, dropoff, setDropoff, setDistanceKm, setDurationMin } = useFreight();

  const [userLoc, setUserLoc] = useState(null);
  const [selecting, setSelecting] = useState("pickup");
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef(null);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  // useFreightRoute hooki to'g'ri ishlatilganiga ishonch hosil qiling
  // Agar pickup.latlng yoki dropoff.latlng yo'q bo'lsa, null berish kerak
  const { routeCoords, distanceKm, durationMin } = useFreightRoute(pickup?.latlng || null, dropoff?.latlng || null);

  useEffect(() => {
    if (distanceKm) setDistanceKm(distanceKm);
    if (durationMin) setDurationMin(durationMin);
  }, [distanceKm, durationMin, setDistanceKm, setDurationMin]);

  // Dastlabki markazni aniqlash
  const defaultCenter = [42.46, 59.61]; // Nukus
  const mapCenter = useMemo(() => {
    if (pickup?.latlng) return pickup.latlng;
    if (userLoc) return userLoc;
    return defaultCenter;
  }, [pickup.latlng, userLoc]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error("Geo error:", err),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const reverseToAddress = useCallback(async (latlng, which) => {
    if (!latlng) return;
    
    // Eski so'rovni bekor qilish
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
      abortRef.current = null;
    }

    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const addr = await nominatimReverse(latlng[0], latlng[1], ctrl.signal);
        if (ctrl.signal.aborted) return;
        
        if (which === "pickup") {
          setPickup(prev => ({ ...prev, latlng, address: addr || "" }));
        } else if (which === "dropoff") {
          setDropoff(prev => ({ ...prev, latlng, address: addr || "" }));
        }
      } catch (e) {
        // Abort xatolarini yutish
      }
    }, 250);
  }, [setPickup, setDropoff]);

  const handleCenterPicked = useCallback((latlng) => {
    if (!selecting) return;
    reverseToAddress(latlng, selecting);
  }, [selecting, reverseToAddress]);

  const swapPoints = () => {
    const tempPickup = { ...pickup };
    const tempDropoff = { ...dropoff };
    setPickup(tempDropoff);
    setDropoff(tempPickup);
  };

  const handleLocateMe = () => {
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
  };

  return (
    <div style={{ position: "relative", height: "52vh", borderRadius: 18, overflow: "hidden" }}>
      <MapContainer 
        center={mapCenter} 
        zoom={14} 
        style={{ height: "100%", width: "100%" }} 
        whenCreated={(m) => (mapRef.current = m)}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        
        {/* Xaritani harakatlantirish */}
        <FlyTo target={mapCenter} zoom={15} />
        
        {/* Markazni kuzatish (drag) */}
        <CenterTracker enabled={!!selecting} onCenter={handleCenterPicked} setIsDragging={setIsDragging} />
        {/* Xarita ustiga bosib tanlash (tap/click) */}
        <ClickPicker enabled={!!selecting} onPick={handleCenterPicked} />
        
        {/* Markerlar - faqat tanlanmayotgan paytda ko'rsatish mantiqan to'g'ri bo'lishi mumkin, 
            lekin sizning kodingizda har doim ko'rsatilgan */}
        {pickup?.latlng && <Marker position={pickup.latlng} />}
        {dropoff?.latlng && <Marker position={dropoff.latlng} />}
        
        {/* Yo'nalish chizig'i */}
        {Array.isArray(routeCoords) && routeCoords.length >= 2 && (
          <Polyline positions={routeCoords} pathOptions={{ color: "#22c55e", weight: 6, opacity: 1 }} />
        )}
      </MapContainer>

      {/* Markaziy Pin (Center Pin) - MapContainer tashqarisida emas, ustida bo'lishi kerak, 
          lekin MapContainer ichida HTML element to'g'ridan-to'g'ri ishlamaydi. 
          Shuning uchun absolute position bilan ustiga chiqaramiz. */}
      {selecting && (
        <div className={`fr-centerpin ${isDragging ? "dragging" : ""}`} aria-hidden="true">
          <div style={{ width: 70, height: 80 }} dangerouslySetInnerHTML={{ __html: pinSvg() }} />
          <div className="fr-pinlabel">
            {selecting === "pickup" ? "Yuborish joyi" : "Tushirish joyi"}
          </div>
        </div>
      )}

      {/* Geolokatsiya tugmasi */}
      <div style={{ position: "absolute", right: 12, top: 12, zIndex: 800 }}>
        <Button 
          shape="circle" 
          size="large" 
          icon={<AimOutlined />} 
          onClick={handleLocateMe} 
        />
      </div>

      {/* Pastki boshqaruv tugmalari */}
      <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, zIndex: 800, display: "flex", gap: 10 }}>
        <Button 
          icon={<EnvironmentOutlined />} 
          onClick={() => setSelecting("pickup")} 
          style={{ flex: 1, borderRadius: 14 }} 
          type={selecting === "pickup" ? "primary" : "default"}
        >
          Yuborish
        </Button>
        <Button 
          icon={<EnvironmentOutlined />} 
          onClick={() => setSelecting("dropoff")} 
          style={{ flex: 1, borderRadius: 14 }} 
          type={selecting === "dropoff" ? "primary" : "default"}
        >
          Tushirish
        </Button>
        <Button icon={<SwapOutlined />} onClick={swapPoints} style={{ borderRadius: 14 }} />
      </div>


      {/* Manzil tanlash (button + mapdan belgilash) */}
      <div style={{ position: "absolute", left: 12, right: 12, top: 64, zIndex: 800, display: "grid", gap: 8 }}>
        <Button
          icon={<EnvironmentOutlined />}
          onClick={() => setSelecting("pickup")}
          style={{ borderRadius: 14, textAlign: "left", height: 44, justifyContent: "flex-start" }}
          type={selecting === "pickup" ? "primary" : "default"}
        >
          {pickup?.address ? `Yuborish: ${pickup.address}` : "Yuborish manzilini tanlang"}
        </Button>
        <Button
          icon={<EnvironmentOutlined />}
          onClick={() => setSelecting("dropoff")}
          style={{ borderRadius: 14, textAlign: "left", height: 44, justifyContent: "flex-start" }}
          type={selecting === "dropoff" ? "primary" : "default"}
        >
          {dropoff?.address ? `Tushirish: ${dropoff.address}` : "Tushirish manzilini tanlang"}
        </Button>
      </div>



      {/* CSS Styles - dangerouslySetInnerHTML bilan xavfsiz */}
      <style dangerouslySetInnerHTML={{ __html: `
        .fr-centerpin {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 700;
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
          background: rgba(17,17,17,.85);
          color: #fff;
          padding: 6px 10px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 12px;
          box-shadow: 0 10px 24px rgba(0,0,0,.25);
          transition: opacity .2s;
        }
        .fr-centerpin.dragging .fr-pinlabel {
          opacity: .6;
        }
      ` }} />
    </div>
  );
}