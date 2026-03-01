// ============================================================================
// OSRM Routing Service
// Location: src/shared/services/osrm.js
// Purpose: Handle routing calculations and distance calculations
// ============================================================================

/**
 * Get driving route from OSRM (Open Source Routing Machine)
 * 
 * @param {Array<[number, number]>} points - Array of coordinate pairs [lat, lng]
 * @returns {Promise<{distance_m: number, duration_s: number, coords: Array} | null>}
 *   Returns route data with distance in meters, duration in seconds, and coordinates
 *   Returns null if request fails or points are invalid
 * 
 * @example
 * const route = await osrmRouteDriving([[41.3, 69.2], [41.4, 69.3]]);
 * // { distance_m: 15000, duration_s: 600, coords: [[41.3, 69.2], ...] }
 */
export async function osrmRouteDriving(points) {
  // Validate input
  if (!Array.isArray(points) || points.length < 2) return null;

  try {
    // Filter and format coordinates for OSRM API (lng,lat format)
    const coords = points
      .filter((p) => 
        Array.isArray(p) && 
        p.length === 2 && 
        Number.isFinite(+p[0]) && 
        Number.isFinite(+p[1])
      )
      .map((p) => `${p[1]},${p[0]}`)
      .join(";");

    // Ensure we have valid coordinates
    if (!coords || coords.split(";").length < 2) return null;

    // Build OSRM request URL
    const url =
      `https://router.project-osrm.org/route/v1/driving/${coords}` +
      `?overview=full&geometries=geojson&steps=false&annotations=false`;

    // Fetch route from OSRM API
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const route = data?.routes?.[0];

    // Validate response has coordinates
    if (!route?.geometry?.coordinates?.length) return null;

    // Convert GeoJSON coordinates (lng,lat) back to lat,lng format
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
 * 
 * This is the main distance calculation function used throughout the app.
 * It implements the Haversine formula for great-circle distances on Earth.
 * 
 * @param {[number, number]} pointA - First coordinate [lat, lng]
 * @param {[number, number]} pointB - Second coordinate [lat, lng]
 * @returns {number} Distance in kilometers
 * 
 * @example
 * const dist = haversineKm([41.3, 69.2], [41.4, 69.3]);
 * console.log(dist); // ~7.8 km
 * 
 * @note
 * - This function is EXPORTED and should be IMPORTED by other files
 * - DO NOT define local haversineKm functions in component files
 * - Always import: import { haversineKm } from "@/shared/services/osrm"
 * - Returns 0 if either point is null/undefined
 */
export function haversineKm(pointA, pointB) {
  // Validate inputs
  if (!pointA || !pointB) return 0;

  // Convert degrees to radians
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // Earth radius in kilometers

  // Calculate differences
  const dLat = toRad(pointB[0] - pointA[0]);
  const dLng = toRad(pointB[1] - pointA[1]);
  const lat1 = toRad(pointA[0]);
  const lat2 = toRad(pointB[0]);

  // Haversine formula components
  const sin1 = Math.sin(dLat / 2) ** 2;
  const sin2 = Math.sin(dLng / 2) ** 2;

  // Calculate angular distance in radians
  const c =
    2 *
    Math.atan2(
      Math.sqrt(sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2),
      Math.sqrt(1 - (sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2))
    );

  // Convert to kilometers
  return R * c;
}

/**
 * Alternative simpler distance calculation
 * 
 * Use this if the main haversineKm has issues
 * Implements a slightly different version of the Haversine formula
 * 
 * @param {[number, number]} a - First point [lat, lng]
 * @param {[number, number]} b - Second point [lat, lng]
 * @returns {number} Distance in kilometers
 * 
 * @example
 * const dist = calculateDistanceSimple([41.3, 69.2], [41.4, 69.3]);
 */
export function calculateDistanceSimple(a, b) {
  // Validate inputs
  if (!a || !b) return 0;

  // Convert degrees to radians
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  // Calculate differences
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  // Calculate sine components
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  // Haversine calculation
  const a_val = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(a_val), Math.sqrt(1 - a_val));

  return R * c;
}

/**
 * ============================================================================
 * IMPORTANT: How to use these functions in your components
 * ============================================================================
 * 
 * ✅ CORRECT USAGE:
 * 
 * import { osrmRouteDriving, haversineKm } from "@/shared/services/osrm";
 * 
 * // In component:
 * const distance = haversineKm([41.3, 69.2], [41.4, 69.3]);
 * const route = await osrmRouteDriving([[41.3, 69.2], [41.4, 69.3]]);
 * 
 * 
 * ❌ INCORRECT USAGE (will cause errors):
 * 
 * // DO NOT define your own haversineKm!
 * function haversineKm(a, b) { ... }  // ❌ DUPLICATE - will cause collision!
 * 
 * // Always import instead:
 * import { haversineKm } from "@/shared/services/osrm";  // ✅ CORRECT
 * 
 * 
 * ============================================================================
 * Troubleshooting
 * ============================================================================
 * 
 * Error: "The symbol 'haversineKm' has already been declared"
 * Solution: Remove any local haversineKm function definitions
 *          Import haversineKm from this file instead
 * 
 * Error: "Cannot find module '@/shared/services/osrm'"
 * Solution: Check that this file is at: src/shared/services/osrm.js
 *          Update import path if file is in different location
 * 
 * Error: "haversineKm is not exported"
 * Solution: Make sure this file has: export function haversineKm(...)
 *          Clear node_modules cache: rm -rf node_modules/.vite
 * 
 * ============================================================================
 */
