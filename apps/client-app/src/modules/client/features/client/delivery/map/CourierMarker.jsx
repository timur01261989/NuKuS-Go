import React, { useEffect, useMemo, useRef, useState } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";
import { orderAssets } from "@/assets/order";
import { realtimeAssets } from "@/assets/realtime";
import { mapAssets } from "@/assets/map";

/**
 * CourierMarker
 * - bearing (gradus) bo'lsa ikon buriladi
 * - position o'zgarganda silliq animatsiya (interpolation)
 */
function resolveCourierMarker(vehicle) {
  const value = String(vehicle || "").toLowerCase();
  if (value.includes("bike") || value.includes("bicycle")) return mapAssets.courierBikeMarker || realtimeAssets.markers.markerRideDriver || orderAssets.tracking.courierDeliBicycle;
  if (value.includes("foot") || value.includes("walk")) return realtimeAssets.markers.markerUserDriver || orderAssets.tracking.courierDeliFeet;
  if (value.includes("moto") || value.includes("motor")) return realtimeAssets.markers.markerDriverFix || orderAssets.tracking.courierDeliMoto;
  if (value.includes("car") || value.includes("auto")) return mapAssets.searchCarStart || mapAssets.searchCar || realtimeAssets.markers.markerDriver || orderAssets.tracking.courierDeliCar;
  return realtimeAssets.navigation.trackingProgressPin || orderAssets.tracking.courierDeliScooter || orderAssets.courier.orderProgressPin;
}

function makeIcon(markerSrc, bearing = 0) {
  const html = `
    <div style="
      width: 48px; height: 48px; border-radius: 24px;
      background: rgba(255,255,255,.96);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 12px 24px rgba(0,0,0,.18);
      border: 1px solid rgba(15,23,42,.08);
    ">
      <img
        src="${markerSrc}"
        alt=""
        style="width: 34px; height: 34px; object-fit: contain; transform: rotate(${bearing}deg);"
      />
    </div>`;
  return L.divIcon({ html, className: "courier-marker", iconSize: [48, 48], iconAnchor: [24, 24] });
}

export default function CourierMarker({ position, bearing = 0, vehicle }) {
  const [pos, setPos] = useState(position);
  const rafRef = useRef(null);
  const fromRef = useRef(position);
  const toRef = useRef(position);
  const tRef = useRef(0);

  useEffect(() => {
    if (!position) return;
    fromRef.current = pos || position;
    toRef.current = position;
    tRef.current = 0;

    const step = () => {
      tRef.current += 0.06;
      const t = Math.min(1, tRef.current);
      const a = fromRef.current;
      const b = toRef.current;
      const lerp = (x, y) => x + (y - x) * t;
      const next = [lerp(a[0], b[0]), lerp(a[1], b[1])];
      setPos(next);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [position]); // eslint-disable-line react-hooks/exhaustive-deps

  const icon = useMemo(() => makeIcon(resolveCourierMarker(vehicle), bearing || 0), [bearing, vehicle]);

  if (!pos) return null;
  return <Marker position={pos} icon={icon} />;
}
