import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { useIntercity } from "../context/IntercityContext";
import { useRoutePolyline } from "./useRoutePolyline";

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FitBounds({ fromLatLng, toLatLng }) {
  const map = useMap();
  useEffect(() => {
    if (!fromLatLng || !toLatLng) return;
    const b = L.latLngBounds(fromLatLng, toLatLng);
    map.fitBounds(b, { paddingTopLeft: [30, 30], paddingBottomRight: [30, 260] });
  }, [map, fromLatLng, toLatLng]);
  return null;
}

export default function IntercityMap({ height = "52vh" }) {
  const { fromCity, toCity } = useIntercity();

  const fromLatLng = fromCity?.latlng;
  const toLatLng = toCity?.latlng;

  const { coords } = useRoutePolyline(fromLatLng, toLatLng);

  const center = useMemo(() => {
    if (fromLatLng && toLatLng) return [(fromLatLng[0] + toLatLng[0]) / 2, (fromLatLng[1] + toLatLng[1]) / 2];
    return fromLatLng || [41.2995, 69.2401];
  }, [fromLatLng, toLatLng]);

  return (
    <div style={{ height, width: "100%", borderRadius: 18, overflow: "hidden", position: "relative" }}>
      <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        {fromLatLng && <Marker position={fromLatLng} icon={defaultIcon} />}
        {toLatLng && <Marker position={toLatLng} icon={defaultIcon} />}
        {coords && <Polyline positions={coords} pathOptions={{ weight: 5, opacity: 0.9 }} />}
        <FitBounds fromLatLng={fromLatLng} toLatLng={toLatLng} />
      </MapContainer>
    </div>
  );
}
