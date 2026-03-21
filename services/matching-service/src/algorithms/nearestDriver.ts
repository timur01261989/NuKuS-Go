import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
});

export interface MatchedDriver {
  driver_id:   string;
  distance_km: number;
  lat:         number;
  lng:         number;
  eta_minutes: number;
}

export async function findBestDriver(
  pickupLat: number,
  pickupLng: number,
  serviceType: string,
  radiusKm = 5
): Promise<MatchedDriver | null> {
  const key = `drivers:geo:${serviceType}`;

  const results = await redis.georadius(
    key, pickupLng, pickupLat, radiusKm, "km",
    "WITHCOORD", "WITHDIST", "COUNT", 20, "ASC"
  ) as any[];

  if (!results?.length) return null;

  // Filter only available drivers
  for (const r of results) {
    const [driverId, distance, [lng, lat]] = r;
    const metaRaw = await redis.get(`driver:meta:${driverId}`);
    const meta = metaRaw ? JSON.parse(metaRaw) : null;

    if (meta?.status === "online") {
      return {
        driver_id:   driverId,
        distance_km: parseFloat(distance),
        lat:         parseFloat(lat),
        lng:         parseFloat(lng),
        eta_minutes: Math.ceil((parseFloat(distance) / 35) * 60) + 2,
      };
    }
  }
  return null;
}
