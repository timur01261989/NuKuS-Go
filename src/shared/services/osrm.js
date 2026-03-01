// OSRM Routing Service
// Location: src/features/client/shared/geo/osrm.js
// OR: src/shared/services/osrm.js

/**
 * Get driving route from OSRM (Open Source Routing Machine)
 * @param {Array<[lat, lng]>} points - Array of coordinate pairs
 * @returns {Promise<{distance_m, duration_s, coords}>} Route data
 */
export async function osrmRouteDriving(points) {
  try {
    if (!Array.isArray(points) || points.length < 2) return null;
    
    // Format coordinates for OSRM (lng,lat format)
    const coords = points
      .filter((p) => Array.isArray(p) && p.length === 2 && Number.isFinite(+p[0]) && Number.isFinite(+p[1]))
      .map((p) => `${p[1]},${p[0]}`)
      .join(";");
    
    if (!coords || coords.split(";").length < 2) return null;

    // Build OSRM request URL
    const url =
      `https://router.project-osrm.org/route/v1/driving/${coords}` +
      `?overview=full&geometries=geojson&steps=false&annotations=false`;
    
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const data = await res.json();
    const route = data?.routes?.[0];
    
    if (!route?.geometry?.coordinates?.length) return null;

    // Convert GeoJSON coordinates back to lat/lng format
    const latlng = route.geometry.coordinates.map((c) => [c[1], c[0]]);
    
    return {
      distance_m: route.distance ?? null,
      duration_s: route.duration ?? null,
      coords: latlng,
    };
  } catch (e) {
    console.error("OSRM route error:", e);
    return null;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {[lat, lng]} pointA - First coordinate
 * @param {[lat, lng]} pointB - Second coordinate
 * @returns {number} Distance in kilometers
 */
export function haversineKm(pointA, pointB) {
  if (!pointA || !pointB) return 0;
  
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  
  const dLat = toRad(pointB[0] - pointA[0]);
  const dLng = toRad(pointB[1] - pointA[1]);
  const lat1 = toRad(pointA[0]);
  const lat2 = toRad(pointB[0]);
  
  const sin1 = Math.sin(dLat / 2) ** 2;
  const sin2 = Math.sin(dLng / 2) ** 2;
  
  const c =
    2 *
    Math.atan2(
      Math.sqrt(sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2),
      Math.sqrt(1 - (sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2))
    );
  
  return R * c;
}

/**
 * Alternative haversine calculation (simpler version)
 * Use this if above version has issues
 * @param {[lat, lng]} a - First point
 * @param {[lat, lng]} b - Second point
 * @returns {number} Distance in km
 */
export function calculateDistanceSimple(a, b) {
  if (!a || !b) return 0;
  
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // km
  
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  
  const a_val = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(a_val), Math.sqrt(1 - a_val));
  
  return R * c;
}
