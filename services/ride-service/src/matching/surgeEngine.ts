/**
 * Surge Pricing Engine
 * Multiplies base fare when demand exceeds supply in an area
 */

export interface SurgeParams {
  lat: number;
  lng: number;
  base_price_uzs: number;
}

export interface SurgeResult {
  multiplier: number;
  final_price_uzs: number;
  reason?: string;
}

/**
 * Get surge multiplier from location-service zone manager
 */
export async function applySurge(params: SurgeParams): Promise<SurgeResult> {
  const locationUrl = process.env.LOCATION_SERVICE_URL || "http://location-service:3005";

  try {
    const res = await fetch(
      `${locationUrl}/location/surge?lat=${params.lat}&lng=${params.lng}`,
      { signal: AbortSignal.timeout(1000) }
    );
    if (res.ok) {
      const { multiplier, zone_name } = await res.json();
      const m = Math.max(1.0, Math.min(4.0, multiplier || 1.0));
      return {
        multiplier: m,
        final_price_uzs: Math.round(params.base_price_uzs * m),
        reason: m > 1.0 ? `${zone_name || "Talablar oshdi"}: x${m.toFixed(1)}` : undefined,
      };
    }
  } catch { /* fallback */ }

  return { multiplier: 1.0, final_price_uzs: params.base_price_uzs };
}

/**
 * Calculate base fare from distance + time
 */
export function calculateBaseFare(distanceKm: number, durationMin: number): number {
  const BASE_FARE    = 3000;    // UZS — minimum fare
  const PER_KM       = 1500;    // UZS per km
  const PER_MIN      = 200;     // UZS per minute (traffic)
  return Math.max(BASE_FARE, Math.round(distanceKm * PER_KM + durationMin * PER_MIN));
}
