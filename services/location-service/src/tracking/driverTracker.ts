import { RedisGeo } from "../redis";
import { publishOne, USER_TOPICS } from "@unigo/event-bus";

const geo = new RedisGeo();

export interface DriverPosition {
  driver_id: string;
  lat: number;
  lng: number;
  bearing: number;
  speed: number;
  ts: number;
}

// Batch buffer for PostgreSQL persistence (write every 30s)
const batchBuffer: DriverPosition[] = [];
let batchTimer: ReturnType<typeof setInterval> | null = null;

export function startBatchFlush(flushFn: (positions: DriverPosition[]) => Promise<void>) {
  if (batchTimer) return;
  batchTimer = setInterval(async () => {
    if (!batchBuffer.length) return;
    const batch = batchBuffer.splice(0, batchBuffer.length);
    await flushFn(batch).catch(console.error);
  }, 30_000); // Every 30 seconds
}

/**
 * Process a driver location update:
 * 1. Update Redis GEORADIUS (instant, sub-50ms)
 * 2. Publish to Kafka driver.location topic (fan-out)
 * 3. Buffer for PostgreSQL batch write
 */
export async function trackDriver(pos: DriverPosition): Promise<void> {
  // 1. Redis — real-time geo index
  await geo.addDriver(pos.driver_id, pos.lat, pos.lng);
  await geo.setMeta(pos.driver_id, {
    lat: pos.lat,
    lng: pos.lng,
    bearing: pos.bearing,
    speed: pos.speed,
    ts: pos.ts,
    status: "online",
  });

  // 2. Kafka — fan-out to matching, ws-gateway, analytics
  await publishOne(
    USER_TOPICS.LOCATION_UPDATE,
    pos,
    pos.driver_id
  ).catch(() => null); // Non-blocking

  // 3. Buffer for batch DB write
  batchBuffer.push(pos);
}
