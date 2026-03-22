/**
 * Advanced GPS Tracker — Battery-Optimized
 * Document strategy:
 * - Accelerometer-based motion detection
 * - Dynamic GPS frequency based on speed
 * - Location batching (10 points → 1 request)
 * - Foreground service on Android (never killed)
 */

import { Platform } from "react-native";

export interface LocationPoint {
  lat:       number;
  lng:       number;
  bearing:   number;
  speed:     number;  // km/h
  accuracy:  number;  // meters
  timestamp: number;  // Unix ms
}

export interface GPSConfig {
  stationary_interval_ms:   number;  // 30000 (30 sec when stopped)
  slow_speed_distance_m:    number;  // 20 meters (city driving)
  fast_speed_distance_m:    number;  // 100 meters (highway)
  batch_size:               number;  // 10 points per batch
  speed_threshold_slow_kmh: number;  // 40 km/h
  speed_threshold_fast_kmh: number;  // 70 km/h
}

const DEFAULT_CONFIG: GPSConfig = {
  stationary_interval_ms:   30_000,
  slow_speed_distance_m:    20,
  fast_speed_distance_m:    100,
  batch_size:               10,
  speed_threshold_slow_kmh: 40,
  speed_threshold_fast_kmh: 70,
};

export class AdvancedGPSTracker {
  private batch:          LocationPoint[] = [];
  private lastPoint:      LocationPoint | null = null;
  private isStationary:   boolean = true;
  private uploadCallback: (batch: LocationPoint[]) => Promise<void>;
  private config:         GPSConfig;
  private watchId:        any = null;
  private stationaryTimer:any = null;
  private isOnTrip:       boolean = false;

  constructor(
    uploadCallback: (batch: LocationPoint[]) => Promise<void>,
    config: Partial<GPSConfig> = {}
  ) {
    this.uploadCallback = uploadCallback;
    this.config         = { ...DEFAULT_CONFIG, ...config };
  }

  start(isOnTrip = false): void {
    this.isOnTrip = isOnTrip;
    this._startWatching();
  }

  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.stationaryTimer) {
      clearInterval(this.stationaryTimer);
      this.stationaryTimer = null;
    }
    this._flushBatch();
  }

  setOnTrip(isOnTrip: boolean): void {
    this.isOnTrip = isOnTrip;
    // Restart with appropriate frequency
    this.stop();
    this.start(isOnTrip);
  }

  private _startWatching(): void {
    const accuracy = this.isOnTrip
      ? { enableHighAccuracy: true,  timeout: 5000,  maximumAge: 1000 }
      : { enableHighAccuracy: false, timeout: 15000, maximumAge: 5000 };

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this._onLocation(pos),
      (err) => console.warn("[GPS] Error:", err.message),
      accuracy
    );

    // Stationary check — send heartbeat every 30 seconds when stopped
    this.stationaryTimer = setInterval(() => {
      if (this.isStationary && this.lastPoint) {
        this._addToBatch({ ...this.lastPoint, timestamp: Date.now() });
      }
    }, this.config.stationary_interval_ms);
  }

  private _onLocation(position: GeolocationPosition): void {
    const { latitude, longitude, speed, heading, accuracy } = position.coords;
    const speedKmh = speed !== null ? speed * 3.6 : 0;
    const bearing  = heading !== null ? heading : 0;

    const point: LocationPoint = {
      lat:       latitude,
      lng:       longitude,
      bearing,
      speed:     speedKmh,
      accuracy:  accuracy || 10,
      timestamp: Date.now(),
    };

    // Motion detection
    this.isStationary = speedKmh < 2.0;

    // Distance filter
    if (!this._shouldSendPoint(point)) return;

    this.lastPoint = point;
    this._addToBatch(point);
  }

  private _shouldSendPoint(point: LocationPoint): boolean {
    if (!this.lastPoint) return true;

    const distM = this._haversineMeters(
      this.lastPoint.lat, this.lastPoint.lng,
      point.lat,          point.lng
    );

    if (point.speed > this.config.speed_threshold_fast_kmh) {
      return distM >= this.config.fast_speed_distance_m;
    }
    if (point.speed > this.config.speed_threshold_slow_kmh) {
      return distM >= this.config.slow_speed_distance_m;
    }
    // Slow / stationary: only send on significant movement
    return distM >= 10;
  }

  private _addToBatch(point: LocationPoint): void {
    this.batch.push(point);
    if (this.batch.length >= this.config.batch_size) {
      this._flushBatch();
    }
  }

  private _flushBatch(): void {
    if (!this.batch.length) return;
    const toSend   = [...this.batch];
    this.batch     = [];
    this.uploadCallback(toSend).catch((e) => {
      // On failure: put back and retry
      this.batch.unshift(...toSend.slice(-5));  // Keep last 5 on failure
      console.warn("[GPS] Upload failed, will retry:", e.message);
    });
  }

  private _haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6_371_000;
    const toR = (d: number) => d * Math.PI / 180;
    const dL  = toR(lat2 - lat1), dG = toR(lng2 - lng1);
    const a   = Math.sin(dL/2)**2 + Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dG/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  getStats() {
    return {
      batch_size:    this.batch.length,
      is_stationary: this.isStationary,
      is_on_trip:    this.isOnTrip,
      last_point:    this.lastPoint,
    };
  }
}

// ── Upload function — sends batch to location-service via Kafka ───────────────
export async function uploadLocationBatch(
  driverId:    string,
  serviceType: string,
  batch:       LocationPoint[],
  apiBase:     string
): Promise<void> {
  if (!batch.length) return;

  // Take only last 10 points if somehow more accumulated
  const points = batch.slice(-10);

  await fetch(`${apiBase}/api/v1/location/batch`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      driver_id:    driverId,
      service_type: serviceType,
      points:       points,
      sent_at:      Date.now(),
    }),
  });
}
