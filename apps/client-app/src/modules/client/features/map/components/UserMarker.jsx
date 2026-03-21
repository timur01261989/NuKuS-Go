import { Marker } from "react-leaflet";
import L from "leaflet";

export default function UserMarker({ position }) {
  const icon = L.divIcon({
    className: "user-marker",
    html: '<div class="pulse-ring"></div><div class="dot"></div>'
  });

  return <Marker position={position} icon={icon} />;
}
