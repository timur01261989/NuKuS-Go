import Redis from "ioredis";
import { TrafficData } from "./routing.types";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

const TRAFFIC_PREFIX = "traffic:seg:";
const TRAFFIC_TTL = 300; // 5 minutes

export async function updateTrafficSegment(data: TrafficData): Promise<void> {
  const key = `${TRAFFIC_PREFIX}${data.segment_id}`;
  await redis.setex(key, TRAFFIC_TTL, JSON.stringify({ ...data, updated_at: new Date().toISOString() }));
  // Also store in geo index for spatial queries
  await redis.geoadd("traffic:geo", data.from_lng, data.from_lat, data.segment_id);
}

export async function getNearbyTrafficSegments(
  lat: number, lng: number, radiusKm = 5
): Promise<TrafficData[]> {
  try {
    const segIds = await redis.georadius("traffic:geo", lng, lat, radiusKm, "km", "COUNT", 100) as string[];
    if (!segIds?.length) return [];
    const pipeline = redis.pipeline();
    for (const id of segIds) pipeline.get(`${TRAFFIC_PREFIX}${id}`);
    const results = await pipeline.exec() || [];
    return results
      .map(([err, val]) => (!err && val ? JSON.parse(val as string) : null))
      .filter(Boolean) as TrafficData[];
  } catch { return []; }
}

export function getTrafficFactor(segments: TrafficData[]): number {
  if (!segments.length) return 1.0;
  const avgCong = segments.reduce((s, seg) => s + seg.congestion, 0) / segments.length;
  if (avgCong < 0.5) return 1.0;
  if (avgCong < 1.5) return 1.3;
  if (avgCong < 2.5) return 1.7;
  return 2.2;
}

export async function ingestYandexTraffic(apiKey: string, bbox: [number,number,number,number]): Promise<void> {
  // Yandex Traffic API integration (requires API key)
  try {
    const [minLat, minLng, maxLat, maxLng] = bbox;
    const url = `https://api.routing.yandex.net/v2/traffic?rll=${minLng},${minLat}~${maxLng},${maxLat}&apikey=${apiKey}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    // Parse and store segments
    for (const segment of data?.segments || []) {
      await updateTrafficSegment({
        segment_id:  segment.id,
        from_lat:    segment.from.lat,
        from_lng:    segment.from.lon,
        to_lat:      segment.to.lat,
        to_lng:      segment.to.lon,
        speed_kmh:   segment.speed || 40,
        congestion:  Math.min(3, Math.floor((60 - (segment.speed || 60)) / 20)) as 0|1|2|3,
        updated_at:  new Date().toISOString(),
      });
    }
  } catch { /* Traffic ingestion failure is non-critical */ }
}
