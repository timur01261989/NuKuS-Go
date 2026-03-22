import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";
import { mapAssets } from "@/assets/map";

/**
 * VehicleMarker
 * - Smoothly animates marker position when lat/lng changes
 * - Rotates marker by bearing (degrees)
 *
 * Notes:
 * - Works without external rotatedmarker plugin (uses CSS transform)
 * - memo + shallow prop check: xaritada ko‘p marker bo‘lganda qayta render kamayadi
 */
function VehicleMarker({
  position, // [lat, lng]
  bearing = 0,
  label,
  zIndexOffset = 500,
  durationMs = 650,
  size = 38,
  color = "#f6c200",
  onClick,
}) {
  const [pos, setPos] = useState(position);
  const rafRef = useRef(null);
  const fromRef = useRef(position);
  const startRef = useRef(0);

  useEffect(() => {
    if (!position || position.length !== 2) return;
    const from = fromRef.current || position;
    const to = position;

    // If first time
    if (!pos) {
      setPos(to);
      fromRef.current = to;
      return;
    }

    // Cancel previous animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    startRef.current = performance.now();
    const start = startRef.current;

    const animate = (t) => {
      const k = Math.min(1, (t - start) / durationMs);
      // easeOutCubic
      const e = 1 - Math.pow(1 - k, 3);
      const lat = from[0] + (to[0] - from[0]) * e;
      const lng = from[1] + (to[1] - from[1]) * e;
      setPos([lat, lng]);

      if (k < 1) rafRef.current = requestAnimationFrame(animate);
      else {
        fromRef.current = to;
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.[0], position?.[1]]);

  const icon = useMemo(() => {
    const s = size;
    const markerVisual = mapAssets.searchCarStart || mapAssets.searchCar || mapAssets.courierBikeMarker || "";
    const html = `
      <div class="yg-car-wrap" style="width:${s}px;height:${s}px;">
        <div class="yg-car" style="
          width:${s}px;height:${s}px;
          border-radius: 14px;
          background:${markerVisual ? "rgba(255,255,255,.96)" : color};
          box-shadow: 0 10px 20px rgba(0,0,0,.25);
          display:flex;align-items:center;justify-content:center;
          transform: rotate(${bearing}deg);
          transform-origin: 50% 50%;
          border: 1px solid rgba(15,23,42,.08);
          overflow: hidden;
        ">
          ${markerVisual
            ? `<img src="${markerVisual}" alt="" style="width:${Math.round(s * 0.82)}px;height:${Math.round(s * 0.82)}px;object-fit:contain;" />`
            : `<div style="
            width:${Math.round(s * 0.52)}px;height:${Math.round(s * 0.52)}px;
            border-radius: 10px;
            background: rgba(0,0,0,.18);
            position: relative;
          ">
            <div style="
              position:absolute;left:50%;top:-4px;transform:translateX(-50%);
              width:12px;height:10px;border-radius:0 0 10px 10px;
              background: rgba(0,0,0,.25);
            "></div>
          </div>`}
        </div>
        ${label ? `<div class="yg-car-label">${label}</div>` : ``}
      </div>
    `;
    return L.divIcon({
      className: "yg-vehicle-icon",
      html,
      iconSize: [s, s],
      iconAnchor: [s / 2, s / 2],
    });
  }, [bearing, label, size, color]);

  if (!pos) return null;

  return (
    <Marker
      position={pos}
      icon={icon}
      zIndexOffset={zIndexOffset}
      eventHandlers={onClick ? { click: onClick } : undefined}
    />
  );
}

function vehicleMarkerPropsEqual(prev, next) {
  const pp = prev.position;
  const np = next.position;
  return (
    pp?.[0] === np?.[0] &&
    pp?.[1] === np?.[1] &&
    prev.bearing === next.bearing &&
    prev.label === next.label &&
    prev.zIndexOffset === next.zIndexOffset &&
    prev.durationMs === next.durationMs &&
    prev.size === next.size &&
    prev.color === next.color &&
    prev.onClick === next.onClick
  );
}

export default memo(VehicleMarker, vehicleMarkerPropsEqual);
