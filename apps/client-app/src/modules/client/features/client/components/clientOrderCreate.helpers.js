import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { mapAssets } from "@/assets/map";

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function fmtMoney(n) {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

export async function nominatimSearch(q, signal) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=7&addressdetails=1&q=${encodeURIComponent(
    q
  )}&countrycodes=uz`;
  try {
    const res = await fetch(url, { signal, headers: { "Accept-Language": "uz,ru,en" } });
    const data = await res.json();
    return (data || []).map((x) => ({
      id: x.place_id,
      label: x.display_name,
      lat: parseFloat(x.lat),
      lng: parseFloat(x.lon),
    }));
  } catch (e) {
    if (e?.name === "AbortError") return [];
    return [];
  }
}

export function randAround([lat, lng], meters = 900) {
  const dLat = (meters / 111000) * (Math.random() - 0.5) * 2;
  const dLng = (meters / (111000 * Math.cos((lat * Math.PI) / 180))) * (Math.random() - 0.5) * 2;
  return [lat + dLat, lng + dLng];
}

const createVisualIcon = (iconUrl, className) =>
  L.divIcon({
    className,
    html: `<div class="${className}"><img src="${iconUrl}" alt="" draggable="false" /></div>`,
    iconSize: [62, 78],
    iconAnchor: [31, 68],
  });

export const pickupMarkerIcon = createVisualIcon(mapAssets.pickupPin || mapAssets.userPlacemark || mapAssets.userSelf, "yg-miniPin");
export const destMarkerIcon = createVisualIcon(mapAssets.finishPin || mapAssets.dropoffPin || mapAssets.routePoint, "yg-miniDest");


export const carIcon = (bearing = 0) =>
  L.divIcon({
    className: "",
    html: `<div class='yg-car' style='transform: rotate(${bearing}deg);'><img src='${mapAssets.searchCarStart || mapAssets.searchCar || mapAssets.courierBikeMarker || ""}' alt='' style='width:28px;height:28px;object-fit:contain;' /></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

export function FlyTo({ center, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.flyTo(center, zoom, { duration: 0.7 });
  }, [map, center, zoom]);
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

export function FitRoute({ from, to, bottomPad = 320 }) {
  const map = useMap();
  useEffect(() => {
    if (!from || !to) return;
    try {
      const b = L.latLngBounds(from, to);
      map.fitBounds(b, {
        paddingTopLeft: [50, 50],
        paddingBottomRight: [50, bottomPad],
      });
    } catch {
      // ignore
    }
  }, [map, from, to, bottomPad]);
  return null;
}

export const TARIFFS = [
  { id: "start", name: "Start", base: 6500, perKm: 1500, etaMin: 2 },
  { id: "comfort", name: "Komfort", base: 7500, perKm: 1800, etaMin: 4 },
  { id: "econom", name: "Shahar bo'yicha", base: 4500, perKm: 1300, etaMin: 6 },
];
