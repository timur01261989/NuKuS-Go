import { Marker } from "react-leaflet";
import L from "leaflet";

export default function TargetMarker({ position, visible }) {
  if (!visible || !position) return null;

  const icon = L.divIcon({
    className: "target-marker",
    html: `
      <div style="
        width:18px;height:18px;background:#ff4d4f;border-radius:50%;
        border:3px solid #fff;
        box-shadow:0 6px 18px rgba(0,0,0,0.3);
      "></div>
    `
  });

  return <Marker position={position} icon={icon} />;
}
