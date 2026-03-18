import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { nominatimReverse } from "@/modules/client/features/client/shared/geo/nominatim";

/**
 * PRODUCTION-GRADE: Freight logic constants
 * 10+ million foydalanuvchi yuklamasiga chidamli statik ma'lumotlar
 */
export const BODY_TYPES = [
  { value: "motoroller", label: "Motoruller" },
  { value: "labo_damas", label: "Labo / Damas" },
  { value: "gazel", label: "Gazel" },
  { value: "isuzu_kamaz", label: "Isuzu / Kamaz" },
  { value: "fura", label: "Fura" },
];

/**
 * Geometrik nuqtalarni normalizatsiya qilish funksiyasi.
 * Memory-leak oldini olish uchun yordamchi funksiya sifatida tashqarida saqlanadi.
 */
export function normalizePoint(point) {
  if (!point) return null;

  // JSON format {lat, lng}
  if (typeof point === "object" && !Array.isArray(point)) {
    const lat = point.lat ?? point.latitude ?? null;
    const lng = point.lng ?? point.lon ?? point.longitude ?? null;
    if (lat != null && lng != null) return { lat: Number(lat), lng: Number(lng) };
  }

  // Array format [lng, lat]
  if (Array.isArray(point) && point.length >= 2) {
    return { lng: Number(point[0]), lat: Number(point[1]) };
  }

  // WKT "POINT(lng lat)" formati
  if (typeof point === "string") {
    const m = point.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (m) {
      return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) };
    }
  }

  return null;
}

/**
 * MapEventsHandler - Xarita hodisalarini boshqarish komponenti.
 * React.memo bilan optimizatsiya qilingan.
 */
const MapEventsHandler = React.memo(({ onMove }) => {
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      onMove({ lat: center.lat, lng: center.lng });
    },
  });
  return null;
});

/**
 * ChangeMapView - Xarita markazini dasturiy o'zgartirish.
 */
const ChangeMapView = React.memo(({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);
  return null;
});

/**
 * Pin SVG - UI komponenti (Pure Function)
 */
const pinSvg = () => 
  <svg width="70" height="80" viewBox="0 0 70 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M35 0C15.67 0 0 15.67 0 35C0 53.67 35 80 35 80C35 80 70 53.67 70 35C70 15.67 54.33 0 35 0ZM35 47.5C28.1 47.5 22.5 41.9 22.5 35C22.5 28.1 28.1 22.5 35 22.5C41.9 22.5 47.5 28.1 47.5 35C47.5 41.9 41.9 47.5 35 47.5Z" fill="#3B82F6"/>
  </svg>
;

/**
 * PickingMap - Manzilni tanlash uchun asosiy komponent.
 * Senior Architect darajasidagi optimizatsiya.
 */
export const PickingMap = React.memo(({ initialPoint, onSave, onCancel }) => {
  const [picked, setPicked] = useState(() => normalizePoint(initialPoint));
  const [address, setAddress] = useState("");
  const [addrLoading, setAddrLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(() => normalizePoint(initialPoint) || { lat: 42.4603, lng: 59.6103 });

  const abortControllerRef = useRef(null);

  const fetchAddress = useCallback(async (lat, lng) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setAddrLoading(true);
    try {
      const res = await nominatimReverse(lat, lng, { signal: abortControllerRef.current.signal });
      setAddress(res?.label || "Noma'lum manzil");
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Reverse Geocode Error:", err);
        setAddress("Xatolik yuz berdi");
      }
    } finally {
      setAddrLoading(false);
    }
  }, []);

  useEffect(() => {
    if (picked) {
      fetchAddress(picked.lat, picked.lng);
    }
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [picked, fetchAddress]);

  const handleMove = useCallback((center) => {
    setPicked(center);
  }, []);
  const locateMe = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPicked(p);
          setMapCenter(p);
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Inline stillarni useMemo bilan keshlaymiz
  const containerStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-slate-900 text-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold">Manzilni tanlang</h3>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="relative flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={15}
          style={containerStyle}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapEventsHandler onMove={handleMove} />
          <ChangeMapView center={mapCenter} />
        </MapContainer>

        {/* Center Pin Overlay */}
        <div className="pointer-events-none absolute inset-0 z-[900] flex items-center justify-center">
          <div 
            className="mb-[40px]"
            style={{ width: 70, height: 80 }} 
            dangerouslySetInnerHTML={{ __html: pinSvg() }} 
          />
        </div>

        {/* Locate Me Button */}
        <button
          type="button"
          onClick={locateMe}
          className="absolute right-3 top-3 z-[900] px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10 transition-all active:scale-95"
        >
          Mening joylashuvim
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider opacity-50 mb-2">Tanlangan manzil</div>
          <div className="text-lg font-medium leading-tight">
            {addrLoading ? (
              <span className="animate-pulse">Manzil aniqlanmoqda...</span>
            ) : (
              address || "Xaritani harakatlantiring"
            )}
          </div>
          {picked && (
            <div className="mt-2 text-[10px] font-mono opacity-40">
              COORDS: {picked.lat.toFixed(6)}, {picked.lng.toFixed(6)}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-semibold"
          >
            Bekor qilish
          </button>
          <button
            onClick={() => onSave(picked, address)}
            disabled={!picked || addrLoading}
            className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-blue-900/20"
          >
            Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  );
});

PickingMap.displayName = "PickingMap";