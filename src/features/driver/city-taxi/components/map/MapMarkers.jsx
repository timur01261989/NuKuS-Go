import React, { useEffect, useMemo, useRef } from "react";
import { Marker, Polyline } from "react-leaflet";
import L from "leaflet";

import { useTaxi } from "../../context/TaxiProvider";
import { lerpLatLng } from "../../utils/geo";

/**
 * MapMarkers.jsx
 * - Driver marker (rotatsiya + silliq yurish)
 * - Pickup/Dropoff marker
 * - Marshrut polyline (oddiy)
 */

const driverSvg = (rotationDeg = 0) => `
<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="rgba(0,0,0,0.25)"/>
    </filter>
  </defs>
  <g filter="url(#s)" transform="translate(22 22) rotate(${rotationDeg}) translate(-22 -22)">
    <circle cx="22" cy="22" r="16" fill="#111"/>
    <path d="M22 7 L28 22 L22 18 L16 22 Z" fill="#52c41a"/>
    <circle cx="22" cy="22" r="4" fill="#fff"/>
  </g>
</svg>
`;

const pinSvg = (color = "#1890ff") => `
<svg width="42" height="42" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path fill="${color}" d="M12 2c-3.86 0-7 3.14-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
</svg>
`;

function makeDivIcon(html) {
  return L.divIcon({ className: "", html, iconSize: [44, 44], iconAnchor: [22, 22] });
}

export default function MapMarkers() {
  const { state } = useTaxi();
  const driver = state.driverLocation;
  const order = state.activeOrder;

  const driverIcon = useMemo(() => makeDivIcon(driverSvg(driver.heading || 0)), [driver.heading]);

  // Smooth marker position
  const smoothRef = useRef({ cur: null, target: null, raf: null });

  const driverPos = driver.latlng;

  const [pickup, dropoff] = useMemo(() => {
    if (!order) return [null, null];
    const p = order.pickup_lat && order.pickup_lng ? [order.pickup_lat, order.pickup_lng] : null;
    const d = order.dropoff_lat && order.dropoff_lng ? [order.dropoff_lat, order.dropoff_lng] : null;
    return [p, d];
  }, [order]);

  const [polyline, setPolyline] = React.useState(null);

  useEffect(() => {
    if (!pickup || !dropoff) { setPolyline(null); return; }
    setPolyline([pickup, dropoff]);
  }, [pickup, dropoff]);

  useEffect(() => {
    if (!driverPos) return;
    const s = smoothRef.current;

    if (!s.cur) s.cur = driverPos;
    s.target = driverPos;

    const step = () => {
      const { cur, target } = s;
      if (!cur || !target) return;
      const next = lerpLatLng(cur, target, 0.18); // silliqlik
      s.cur = next;

      // stop if near
      const dist = Math.abs(next[0]-target[0]) + Math.abs(next[1]-target[1]);
      if (dist < 0.00002) {
        s.cur = target;
        s.raf = null;
        return;
      }
      s.raf = requestAnimationFrame(step);
    };

    if (!s.raf) s.raf = requestAnimationFrame(step);

    return () => {
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = null;
    };
  }, [driverPos?.[0], driverPos?.[1]]);

  const smoothPos = smoothRef.current.cur || driverPos;

  return (
    <>
      {smoothPos && <Marker position={smoothPos} icon={driverIcon} />}

      {pickup && <Marker position={pickup} icon={makeDivIcon(pinSvg("#1890ff"))} />}
      {dropoff && <Marker position={dropoff} icon={makeDivIcon(pinSvg("#52c41a"))} />}

      {polyline && (
        <Polyline positions={polyline} pathOptions={{ color: "#52c41a", weight: 6, opacity: 0.95 }} />
      )}
    </>
  );
}
