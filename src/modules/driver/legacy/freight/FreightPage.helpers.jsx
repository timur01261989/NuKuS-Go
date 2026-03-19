import React, { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
// IMPORT FIX: To'g'ri manzil ko'rsatildi
import { nominatimReverse } from "@/modules/client/features/client/shared/geo/nominatim";

export const BODY_TYPES = [
  { value: "motoroller", label: "Motoruller" },
  { value: "labo_damas", label: "Labo / Damas" },
  { value: "gazel", label: "Gazel" },
  { value: "isuzu_kamaz", label: "Isuzu / Kamaz" },
  { value: "fura", label: "Fura" },
];

export function normalizePoint(point) {
  if (!point) return null;

  // json {lat,lng}
  if (typeof point === "object" && !Array.isArray(point)) {
    const lat = point.lat ?? point.latitude ?? null;
    const lng = point.lng ?? point.lon ?? point.longitude ?? null;
    if (lat != null && lng != null) return { lat: Number(lat), lng: Number(lng) };
  }

  // [lng, lat]
  if (Array.isArray(point) && point.length >= 2) {
    return { lng: Number(point[0]), lat: Number(point[1]) };
  }

  // "POINT(lng lat)"
  if (typeof point === "string") {
    const m = point.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (m) return { lng: Number(m[1]), lat: Number(m[2]) };
  }

  return null;
}

export function pointToDbValue(p) {
  if (!p) return null;
  return { lat: Number(p.lat), lng: Number(p.lng) };
}

/** ----------------------------- Map helpers ----------------------------- */
export function FlyTo({ target, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target, zoom, { animate: true, duration: 1.0 });
  }, [target, zoom, map]);
  return null;
}

export function CenterTracker({ enabled, onCenter, setIsDragging }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    const onMoveStart = () => setIsDragging(true);
    const onMoveEnd = () => {
      setIsDragging(false);
      const c = map.getCenter();
      onCenter({ lat: c.lat, lng: c.lng });
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

export function MapClickPick({ enabled, onPick }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const pinSvg = () => `
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="20" fill="#3B82F6"/>
  <path d="M36 19c-4 0-7 3-7 7v10l-2 2v3h14v-3l-2-2V26c0-4-3-7-7-7z" fill="#fff"/>
</svg>`;

export function LocationPickerModal({ open, initialPoint, onCancel, onSave }) {
  const [center, setCenter] = useState(() => {
    if (initialPoint?.lat != null && initialPoint?.lng != null) return [initialPoint.lat, initialPoint.lng];
    return [41.31, 69.24]; // Tashkent default
  });
  const [isDragging, setIsDragging] = useState(false);
  const [picked, setPicked] = useState(() => (initialPoint ? { ...initialPoint } : null));
  const [address, setAddress] = useState("");
  const [addrLoading, setAddrLoading] = useState(false);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // reverse initial
    if (initialPoint?.lat != null && initialPoint?.lng != null) {
      setPicked({ ...initialPoint });
      setCenter([initialPoint.lat, initialPoint.lng]);
    }
  }, [open, initialPoint]);

  const reverse = useCallback(async (p) => {
    if (!p) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
      abortRef.current = null;
    }
    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setAddrLoading(true);
      try {
        const a = await nominatimReverse(p.lat, p.lng, { signal: ctrl.signal, swallowErrors: true });
        if (!ctrl.signal.aborted) setAddress(a || "");
      } catch {
        // ignore
      } finally {
        if (!ctrl.signal.aborted) setAddrLoading(false);
      }
    }, 220);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (picked) reverse(picked);
  }, [open, picked, reverse]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPicked(p);
        setCenter([p.lat, p.lng]);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/60">
      <div className="w-full md:w-[920px] md:rounded-2xl bg-[#0b1220] border border-white/10 overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
          <div className="font-semibold">Joylashuvni xaritadan tanlang</div>
          <button onClick={onCancel} className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15">Yopish</button>
        </div>

        <div className="p-3">
          <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ height: "56vh" }}>
            <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <FlyTo target={center} zoom={16} />
              <CenterTracker
                enabled={true}
                setIsDragging={setIsDragging}
                onCenter={(p) => setPicked(p)}
              />
              <MapClickPick
                enabled={true}
                onPick={(p) => {
                  setCenter([p.lat, p.lng]);
                  setPicked(p);
                }}
              />
            </MapContainer>

            {/* center pin */}
            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[calc(50%+18px)] pointer-events-none ${isDragging ? "opacity-80" : "opacity-100"}`}>
              <div style={{ width: 70, height: 80 }} dangerouslySetInnerHTML={{ __html: pinSvg() }} />
            </div>

            {/* locate */}
            <button
              type="button"
              onClick={locateMe}
              className="absolute right-3 top-3 z-[900] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              Men
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-sm opacity-80 mb-1">Tanlangan manzil</div>
            <div className="text-sm">
              {addrLoading ? "Manzil aniqlanmoqda..." : (address || "—")}
            </div>
            {picked && (
              <div className="mt-1 text-xs opacity-70 font-mono">
                {picked.lat.toFixed(6)}, {picked.lng.toFixed(6)}
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              Bekor
            </button>
            <button
              onClick={() => onSave(picked, address)}
              disabled={!picked}
              className="flex-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
            >
              Manzilni saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}