/**
 * ETA Calculator — wraps matching-service /eta endpoint
 * Falls back to simple formula if matching-service unavailable
 */

export interface ETAParams {
  pickup:  { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
}

const R = 6371;
function haversine(a: ETAParams["pickup"], b: ETAParams["pickup"]): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2
    + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export async function calculateETA(params: ETAParams): Promise<{ seconds: number; km: number }> {
  const km = haversine(params.pickup, params.dropoff);
  const matchingUrl = process.env.MATCHING_SERVICE_URL || "http://matching-service:3013";

  try {
    const res = await fetch(`${matchingUrl}/matching/eta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        distance_km: km,
        time_of_day: new Date().getHours(),
        day_of_week: new Date().getDay(),
        active_orders: 0,
      }),
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const { eta_seconds } = await res.json();
      return { seconds: eta_seconds, km };
    }
  } catch { /* fallback */ }

  // Fallback: 30 km/h average
  return { seconds: Math.round((km / 30) * 3600), km };
}
