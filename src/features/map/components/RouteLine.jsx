import { Polyline } from "react-leaflet";

function looksLikeLngLat(p) {
  // OSRM/GeoJSON odatda [lng, lat]
  // lng: -180..180, lat: -90..90
  return (
    Array.isArray(p) &&
    p.length >= 2 &&
    Math.abs(Number(p[0])) <= 180 &&
    Math.abs(Number(p[1])) <= 90
  );
}

function toLatLngPoints(points) {
  if (!Array.isArray(points) || points.length < 2) return [];

  // Agar kelgan nuqtalar [lng,lat] ko‘rinishda bo‘lsa → [lat,lng] ga aylantiramiz
  // Agar allaqachon [lat,lng] bo‘lsa → o‘z holicha qoladi
  // Oddiy heuristika: OSRM’dan kelgan bo‘lsa ko‘pincha [lng,lat]
  const first = points[0];

  // [lng,lat] bo‘lish ehtimoli yuqori bo‘lsa, swap qilamiz
  // (agar siz doim [lat,lng] bersangiz, bu swap qilmaydi)
  const isLngLat = looksLikeLngLat(first);

  return points.map((p) => {
    const a = Number(p?.[0]);
    const b = Number(p?.[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

    // isLngLat bo‘lsa: [lng,lat] -> [lat,lng]
    // aks holda: [lat,lng] -> [lat,lng]
    return isLngLat ? [b, a] : [a, b];
  }).filter(Boolean);
}

const RouteLine = ({ points }) => {
  const latLngPoints = toLatLngPoints(points);
  if (latLngPoints.length < 2) return null;

  return (
    <Polyline
      positions={latLngPoints}
      pathOptions={{
        color: "#2196F3",
        weight: 6,
        opacity: 0.8,
        lineJoin: "round",
      }}
    />
  );
};

export default RouteLine;
