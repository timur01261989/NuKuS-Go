import React, { useEffect, useMemo, useRef, useState } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";

/**
 * CourierMarker
 * - bearing (gradus) bo'lsa ikon buriladi
 * - position o'zgarganda silliq animatsiya (interpolation)
 */
function makeIcon(bearing = 0) {
  const html = `
    <div style="
      width: 44px; height: 44px; border-radius: 22px;
      background: rgba(17,17,17,.92);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 10px 24px rgba(0,0,0,.25);
    ">
      <div style="transform: rotate(${bearing}deg); font-size: 22px;">🛵</div>
    </div>`;
  return L.divIcon({ html, className: "courier-marker", iconSize: [44, 44], iconAnchor: [22, 22] });
}

export default function CourierMarker({ position, bearing = 0 }) {
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
      tRef.current += 0.06; // speed
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

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [position]); // eslint-disable-line react-hooks/exhaustive-deps

  const icon = useMemo(() => makeIcon(bearing || 0), [bearing]);

  if (!pos) return null;
  return <Marker position={pos} icon={icon} />;
}
