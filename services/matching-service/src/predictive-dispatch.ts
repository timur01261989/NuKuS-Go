/**
 * Predictive Dispatch — Pre-warm drivers before user orders
 * Strategy: When user opens app, ML predicts likely destination
 * and pre-notifies nearby drivers to be "ready"
 */

import IORedis from "ioredis";
import { latLngToH3, getKRing, H3_RES } from "@unigo/geo-lib";

const redis = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
});

const FEATURE_STORE_URL = process.env.FEATURE_STORE_URL || "http://feature-store-service:3030";
const WS_URL            = process.env.WS_GATEWAY_URL    || "http://ws-gateway:3010";

export interface PreWarmResult {
  user_id:           string;
  predicted_dest_h3?: string;
  drivers_alerted:   number;
  alert_radius_k:    number;
}

/**
 * Pre-warm drivers when user opens the app.
 * This shaves 2-5 seconds off the first dispatch.
 */
export async function preWarmDrivers(
  userId:     string,
  userLat:    number,
  userLng:    number
): Promise<PreWarmResult> {
  const userCell = latLngToH3(userLat, userLng, H3_RES.BLOCK);

  // Get predicted destination from feature store
  let predictedCell: string | undefined;
  try {
    const res = await fetch(
      `${FEATURE_STORE_URL}/features/predict/destination/${userId}?lat=${userLat}&lng=${userLng}`,
      { signal: AbortSignal.timeout(500) }  // Ultra-fast timeout
    );
    const data = await res.json();
    predictedCell = data.destination || undefined;
  } catch {}

  // Get nearby drivers (k=2 ring = 19 cells)
  const nearbyCells = getKRing(userCell, 2);
  const pipeline    = redis.pipeline();
  for (const cell of nearbyCells) {
    pipeline.hkeys(`driver_h3:taxi:${cell}`);
  }
  const results    = await pipeline.exec() || [];
  const driverIds: string[] = [];
  for (const [err, keys] of results) {
    if (!err && Array.isArray(keys)) driverIds.push(...keys);
  }

  // Send "app_opened" pre-warm signal to nearby drivers via WebSocket
  const uniqueDrivers = [...new Set(driverIds)].slice(0, 20);
  if (uniqueDrivers.length > 0) {
    await fetch(`${WS_URL}/internal/prewarm`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        driver_ids:  uniqueDrivers,
        user_lat:    userLat,
        user_lng:    userLng,
        user_cell:   userCell,
        predicted_dest_cell: predictedCell,
        event:       "user_app_opened",
      }),
    }).catch(() => null);
  }

  // Cache pre-warm result for 60 seconds (avoid repeated pre-warms)
  await redis.setex(`prewarm:${userId}`, 60, JSON.stringify({
    ts:     Date.now(),
    cell:   userCell,
    drivers:uniqueDrivers.length,
  }));

  return {
    user_id:            userId,
    predicted_dest_h3:  predictedCell,
    drivers_alerted:    uniqueDrivers.length,
    alert_radius_k:     2,
  };
}

/**
 * Check if pre-warm already done recently
 */
export async function isPreWarmed(userId: string): Promise<boolean> {
  const cached = await redis.get(`prewarm:${userId}`);
  return !!cached;
}
