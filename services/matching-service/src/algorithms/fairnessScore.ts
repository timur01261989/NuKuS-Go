import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
});

export interface FairnessMetrics {
  driver_id:         string;
  trips_today:       number;
  revenue_today_uzs: number;
  online_minutes:    number;
  fairness_score:    number; // 0-100, higher = more rides should be offered
}

export async function calculateFairness(driverId: string): Promise<FairnessMetrics> {
  const todayKey  = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const statsRaw  = await redis.hgetall(`driver:stats:${driverId}:${todayKey}`);

  const tripsToday       = Number(statsRaw?.trips       || 0);
  const revenueToday     = Number(statsRaw?.revenue_uzs || 0);
  const onlineMinutes    = Number(statsRaw?.online_min  || 0);

  // Drivers with fewer trips get higher fairness score
  const avgTrips = 15;
  const fairness = Math.max(0, Math.min(100, 100 - ((tripsToday / avgTrips) * 50)));

  return {
    driver_id:         driverId,
    trips_today:       tripsToday,
    revenue_today_uzs: revenueToday,
    online_minutes:    onlineMinutes,
    fairness_score:    Math.round(fairness),
  };
}
