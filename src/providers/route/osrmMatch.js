// src/providers/route/osrmMatch.js
// OSRM Map Matching: snaps noisy GPS points to the road network.
// Requires OSRM instance with match service enabled.

function baseUrl() {
  return (import.meta?.env?.VITE_OSRM_BASE_URL || "").replace(/\/+$/,'');
}
function profile() {
  return (import.meta?.env?.VITE_OSRM_PROFILE || "driving").trim() || "driving";
}

/**
 * Snap a single point using OSRM "nearest" endpoint (cheap).
 * Returns { lat, lng } or null.
 */
export async function snapNearestOSRM({ lat, lng }) {
  const b = baseUrl();
  if (!b) throw new Error("VITE_OSRM_BASE_URL missing");
  const url = `${b}/nearest/v1/${profile()}/${lng},${lat}?number=1`;
  const res = await fetch(url);
  const data = await res.json();
  const wp = data?.waypoints?.[0];
  const loc = wp?.location; // [lng,lat]
  if (!res.ok || !Array.isArray(loc)) throw new Error("osrm_nearest_failed");
  return { lng: Number(loc[0]), lat: Number(loc[1]) };
}

/**
 * Snap a short trace to the road using OSRM "match" endpoint (better).
 * points: [{lat,lng}, ...] (2..100 recommended)
 * Returns array of snapped points (lat/lng).
 */
export async function snapToRoadOSRM(points) {
  const b = baseUrl();
  if (!b) throw new Error("VITE_OSRM_BASE_URL missing");
  if (!Array.isArray(points) || points.length < 2) return points || [];

  const coords = points
    .map(p => `${Number(p.lng)},${Number(p.lat)}`)
    .join(";");

  const url = `${b}/match/v1/${profile()}/${coords}?geometries=geojson&overview=full&steps=false`;
  const res = await fetch(url);
  const data = await res.json();
  const geom = data?.matchings?.[0]?.geometry; // geojson line
  const c = geom?.coordinates;
  if (!res.ok || !Array.isArray(c)) throw new Error("osrm_match_failed");

  return c
    .map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }))
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}