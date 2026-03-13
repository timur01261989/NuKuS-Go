import { Marker } from "react-leaflet";
import L from "leaflet";

export default function DriverMarker({ position }) {
  const icon = L.divIcon({
    className: "driver-car-marker",
    html: `
      <div style="
        width:22px;height:22px;border-radius:50%;
        background:#1677ff;
        border:3px solid #fff;
        box-shadow:0 8px 20px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
        font-size:12px;color:#fff;
      ">🚕</div>
    `
  });

  return <Marker position={position} icon={icon} />;
}
