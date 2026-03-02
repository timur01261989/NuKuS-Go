// src/features/map/hooks/useFollowMode.js
import { useEffect } from "react";
import { useMap } from "react-leaflet";

/**
 * useFollowMode
 * When enabled, keeps the map centered on `center` with smooth animation.
 */
export default function useFollowMode({ enabled, center, zoom=16 } = {}) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;
    if (!center || !Number.isFinite(center.lat) || !Number.isFinite(center.lng)) return;

    map.setView([Number(center.lat), Number(center.lng)], Math.max(map.getZoom(), zoom), { animate: true });
  }, [enabled, center?.lat, center?.lng, zoom, map]);
}