// src/features/client/taxi/services/geoService.js
import { haversineKm } from "../../shared/geo/haversine";
import { nominatimReverse as _nominatimReverse } from "../../shared/nominatim/reverse";

/**
 * OSRM multi-stop route (pickup -> [stops...] -> dest)
 */
export async function osrmRouteMulti(points, { signal } = {}) {
  if (!Array.isArray(points) || points.length < 2) return null;
  const coords = points
    .filter(Boolean)
    .map((p) => Array.isArray(p) ? p : [p.lat, p.lng])
    .map(([lat, lng]) => `${lng},${lat}`)
    .join(";");

  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`OSRM route failed: ${res.status}`);
  const data = await res.json();
  const r = data?.routes?.[0];
  if (!r?.geometry?.coordinates) return null;

  const routeCoords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  const distanceKm = (r.distance || 0) / 1000;
  const durationMin = (r.duration || 0) / 60;
  return { coords: routeCoords, distanceKm, durationMin };
}

export async function nominatimReverse(lat, lon, { signal } = {}) {
  // Nominatim reverse expects lat/lon
  return _nominatimReverse(lat, lon, { signal });
}

export { haversineKm };
