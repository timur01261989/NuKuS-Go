/**
 * Real-time Feature Store
 * Centralizes feature computation for all ML models.
 * Inspired by Feast / Hopsworks architecture.
 *
 * Hot features: Redis (< 1ms read)
 * Warm features: PostgreSQL (< 10ms)
 * Cold features: ClickHouse batch (for training)
 */

import IORedis from "ioredis";
import { createClient } from "@supabase/supabase-js";

const redis = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// ── Feature Definitions ───────────────────────────────────────────────────────
export interface UserFeatures {
  user_id:             string;
  trips_total:         number;
  trips_last_30d:      number;
  avg_trip_price_uzs:  number;
  cancel_rate:         number;
  preferred_service:   string;
  peak_usage_hour:     number;
  home_h3_cell?:       string;
  work_h3_cell?:       string;
  last_order_lat?:     number;
  last_order_lng?:     number;
  predicted_destination?: string;
  last_seen_at:        string;
}

export interface DriverFeatures {
  driver_id:           string;
  trips_today:         number;
  trips_last_30d:      number;
  avg_rating:          number;
  acceptance_rate:     number;
  cancel_rate:         number;
  online_hours_today:  number;
  revenue_today_uzs:   number;
  revenue_last_30d:    number;
  peak_hour:           number;
  preferred_service:   string;
  reliability_score:   number;
  fatigue_score:       number;
  updated_at:          string;
}

export interface ZoneFeatures {
  h3_cell:             string;
  demand_score:        number;
  supply_count:        number;
  surge_factor:        number;
  avg_wait_minutes:    number;
  completion_rate:     number;
  updated_at:          string;
}

// ── Feature Store Service ─────────────────────────────────────────────────────
export class FeatureStoreService {

  // TTL constants
  private static USER_TTL   = 300;   // 5 min
  private static DRIVER_TTL = 30;    // 30 sec (real-time)
  private static ZONE_TTL   = 60;    // 1 min

  // ── User Features ───────────────────────────────────────────────────────────
  async getUserFeatures(userId: string): Promise<UserFeatures> {
    const cacheKey = `feat:user:${userId}`;
    const cached   = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as UserFeatures;

    // Compute from DB
    const [tripStats, recentOrders] = await Promise.all([
      sb.from("orders")
        .select("price_uzs, service_type, created_at, status")
        .eq("client_id", userId)
        .order("created_at", { ascending: false })
        .limit(200),
      sb.from("orders")
        .select("pickup_lat, pickup_lng, service_type")
        .eq("client_id", userId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const allTrips     = tripStats.data || [];
    const last30d      = allTrips.filter((t: any) => new Date(t.created_at) > new Date(Date.now() - 30 * 86400000));
    const completed    = allTrips.filter((t: any) => t.status === "completed");
    const cancelled    = allTrips.filter((t: any) => t.status === "cancelled");
    const avgPrice     = completed.length ? completed.reduce((s: number, t: any) => s + (t.price_uzs || 0), 0) / completed.length : 0;
    const cancelRate   = allTrips.length ? cancelled.length / allTrips.length : 0;
    const serviceCount: Record<string, number> = {};
    allTrips.forEach((t: any) => { serviceCount[t.service_type] = (serviceCount[t.service_type] || 0) + 1; });
    const preferredService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "taxi";
    const lastOrder    = (recentOrders.data || [])[0] as any;

    const features: UserFeatures = {
      user_id:           userId,
      trips_total:       allTrips.length,
      trips_last_30d:    last30d.length,
      avg_trip_price_uzs:Math.round(avgPrice),
      cancel_rate:       Math.round(cancelRate * 100) / 100,
      preferred_service: preferredService,
      peak_usage_hour:   this._computePeakHour(allTrips),
      last_order_lat:    lastOrder?.pickup_lat,
      last_order_lng:    lastOrder?.pickup_lng,
      last_seen_at:      new Date().toISOString(),
    };

    await redis.setex(cacheKey, FeatureStoreService.USER_TTL, JSON.stringify(features));
    return features;
  }

  // ── Driver Features ─────────────────────────────────────────────────────────
  async getDriverFeatures(driverId: string): Promise<DriverFeatures> {
    const cacheKey = `feat:driver:${driverId}`;
    const cached   = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as DriverFeatures;

    const today = new Date().toISOString().slice(0, 10);
    const [earnings, rating, presence] = await Promise.all([
      sb.from("driver_earnings").select("net_uzs, gross_uzs, date").eq("driver_id", driverId).gte("date", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
      sb.from("drivers").select("rating, total_rides").eq("user_id", driverId).single(),
      sb.from("driver_presence").select("is_online, active_service_type, last_seen_at").eq("driver_id", driverId).single(),
    ]);

    const earningsData = earnings.data || [];
    const todayEarnings = earningsData.filter((e: any) => e.date === today);
    const todayRevenue  = todayEarnings.reduce((s: number, e: any) => s + (e.net_uzs || 0), 0);
    const monthRevenue  = earningsData.reduce((s: number, e: any) => s + (e.net_uzs || 0), 0);

    const features: DriverFeatures = {
      driver_id:           driverId,
      trips_today:         todayEarnings.length,
      trips_last_30d:      earningsData.length,
      avg_rating:          Number((rating.data as any)?.rating || 5.0),
      acceptance_rate:     0.87,
      cancel_rate:         0.05,
      online_hours_today:  0,
      revenue_today_uzs:   todayRevenue,
      revenue_last_30d:    monthRevenue,
      peak_hour:           18,
      preferred_service:   (presence.data as any)?.active_service_type || "taxi",
      reliability_score:   Math.min(1.0, Number((rating.data as any)?.rating || 5) / 5 * 0.87),
      fatigue_score:       Math.max(0, 1 - todayEarnings.length / 30),
      updated_at:          new Date().toISOString(),
    };

    await redis.setex(cacheKey, FeatureStoreService.DRIVER_TTL, JSON.stringify(features));
    return features;
  }

  // ── Zone Features ────────────────────────────────────────────────────────────
  async getZoneFeatures(h3Cell: string): Promise<ZoneFeatures | null> {
    const cacheKey = `feat:zone:${h3Cell}`;
    const cached   = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as ZoneFeatures;
    return null;  // Computed by analytics service and pushed here
  }

  async updateZoneFeatures(h3Cell: string, data: Partial<ZoneFeatures>): Promise<void> {
    const cacheKey = `feat:zone:${h3Cell}`;
    const existing = await this.getZoneFeatures(h3Cell) || {} as ZoneFeatures;
    const updated  = { ...existing, ...data, h3_cell: h3Cell, updated_at: new Date().toISOString() };
    await redis.setex(cacheKey, FeatureStoreService.ZONE_TTL, JSON.stringify(updated));
  }

  // ── Batch Feature Fetch ──────────────────────────────────────────────────────
  async batchGetDriverFeatures(driverIds: string[]): Promise<Record<string, DriverFeatures>> {
    if (!driverIds.length) return {};
    const keys   = driverIds.map(id => `feat:driver:${id}`);
    const values = await redis.mget(...keys);
    const result: Record<string, DriverFeatures> = {};
    for (let i = 0; i < driverIds.length; i++) {
      if (values[i]) {
        try { result[driverIds[i]] = JSON.parse(values[i]!); } catch {}
      }
    }
    return result;
  }

  // ── Predictive: User's likely destination ───────────────────────────────────
  async getPredictedDestination(userId: string, currentLat: number, currentLng: number): Promise<string | null> {
    const feats = await this.getUserFeatures(userId);
    const hour  = new Date().getHours();
    // Simple heuristic: morning from home-area = work; evening from work-area = home
    if (hour >= 7 && hour <= 9 && feats.home_h3_cell)   return feats.work_h3_cell || null;
    if (hour >= 17 && hour <= 20 && feats.work_h3_cell) return feats.home_h3_cell || null;
    return null;
  }

  private _computePeakHour(trips: any[]): number {
    const hours: Record<number, number> = {};
    for (const t of trips) {
      const h = new Date(t.created_at).getHours();
      hours[h] = (hours[h] || 0) + 1;
    }
    return Number(Object.entries(hours).sort((a, b) => b[1] - a[1])[0]?.[0] || 17);
  }
}
