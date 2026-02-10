import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

export default function RoutingMachine({ from, to, onDistanceMeters }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !from || !to) return;

    const control = L.Routing.control({
      waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
      addWaypoints: false,
      draggableWaypoints: false,
      show: false
    })
      .on("routesfound", (e) => {
        const meters = e?.routes?.[0]?.summary?.totalDistance ?? 0;
        onDistanceMeters(meters);
      })
      .addTo(map);

    return () => {
      try { map.removeControl(control); } catch {}
    };
  }, [map, from, to, onDistanceMeters]);

  return null;
}
