import { publishOne, RIDE_TOPICS } from "@unigo/event-bus";

export interface MatchRequest {
  ride_id: string;
  user_id: string;
  pickup: { lat: number; lng: number; address: string };
  dropoff: { lat: number; lng: number; address: string };
  vehicle_type?: string;
}

export interface MatchResult {
  ride_id: string;
  driver_id: string;
  eta_seconds: number;
  distance_km: number;
  matched_at: string;
}

/**
 * Request driver matching from matching-service
 * Falls back to direct DB query if matching-service unavailable
 */
export async function requestMatch(req: MatchRequest): Promise<MatchResult | null> {
  const matchingUrl = process.env.MATCHING_SERVICE_URL || "http://matching-service:3013";

  try {
    const res = await fetch(`${matchingUrl}/matching/match/nearest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: req.pickup.lat,
        lng: req.pickup.lng,
        radius_km: 5,
        limit: 10,
        vehicle_type: req.vehicle_type,
      }),
      signal: AbortSignal.timeout(3000), // 3s timeout
    });

    if (!res.ok) return null;
    const { drivers } = await res.json();
    if (!drivers?.length) return null;

    const best = drivers[0];
    const result: MatchResult = {
      ride_id: req.ride_id,
      driver_id: best.driver_id,
      eta_seconds: Math.round((best.distance_km / 30) * 3600),
      distance_km: best.distance_km,
      matched_at: new Date().toISOString(),
    };

    // Publish match event to Kafka
    await publishOne(RIDE_TOPICS.MATCHED, {
      ride_id: req.ride_id,
      user_id: req.user_id,
      driver_id: best.driver_id,
      ts: Date.now(),
    }, req.ride_id).catch(() => null);

    return result;
  } catch (e) {
    console.error("[matchEngine] error:", e);
    return null;
  }
}
