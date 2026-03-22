/**
 * Zero-Trust Device Fingerprinting Middleware
 * Prevents: fake drivers, bot orders, account sharing
 *
 * Signals collected (client sends these in headers):
 * - X-Device-ID:       UUID generated on install
 * - X-Screen-Hash:     screen_width*screen_height*pixel_ratio
 * - X-Platform:        android|ios|web
 * - X-App-Version:     1.5.0
 * - X-TLS-Fingerprint: (injected by Cloudflare CF-ray)
 */

import { Request, Response, NextFunction } from "express";
import IORedis from "ioredis";
import crypto from "crypto";

const redis = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

export interface DeviceSignature {
  device_id:    string;
  platform:     string;
  app_version:  string;
  screen_hash:  string;
  ip:           string;
  fingerprint:  string;  // Computed hash
}

function computeFingerprint(sig: Omit<DeviceSignature, "fingerprint">): string {
  return crypto
    .createHash("sha256")
    .update(`${sig.device_id}:${sig.platform}:${sig.screen_hash}`)
    .digest("hex")
    .slice(0, 16);
}

export async function deviceFingerprintMiddleware(
  req: Request, res: Response, next: NextFunction
) {
  const deviceId   = (req.headers["x-device-id"]    || "") as string;
  const platform   = (req.headers["x-platform"]     || "web") as string;
  const appVersion = (req.headers["x-app-version"]  || "0.0.0") as string;
  const screenHash = (req.headers["x-screen-hash"]  || "") as string;
  const ip         = (req.headers["cf-connecting-ip"] || req.ip || "unknown") as string;

  // Build fingerprint
  const sig: DeviceSignature = {
    device_id:   deviceId || `anon_${ip}`,
    platform,
    app_version: appVersion,
    screen_hash: screenHash,
    ip,
    fingerprint: "",
  };
  sig.fingerprint = computeFingerprint(sig);

  // Attach to request
  (req as any).device = sig;

  // If authenticated, check device consistency
  const userId = (req as any).user?.sub;
  if (userId && deviceId) {
    const knownKey = `device:${userId}:${deviceId}`;
    const known    = await redis.get(knownKey).catch(() => null);

    if (!known) {
      // First time — register this device
      await redis.setex(knownKey, 30 * 86400, JSON.stringify({
        fingerprint: sig.fingerprint,
        first_seen:  new Date().toISOString(),
        platform,
      })).catch(() => null);
    } else {
      const knownData = JSON.parse(known);
      // Device fingerprint changed — possible account sharing or attack
      if (knownData.fingerprint !== sig.fingerprint) {
        // Log suspicious activity (don't block yet — log for ML fraud detection)
        await redis.incr(`suspicious:${userId}`).catch(() => null);
        await redis.expire(`suspicious:${userId}`, 3600).catch(() => null);

        const suspCount = await redis.get(`suspicious:${userId}`).catch(() => "0");
        if (Number(suspCount) > 10) {
          // Too many fingerprint mismatches — flag for review
          res.setHeader("X-Security-Flag", "fingerprint_mismatch");
        }
      }
    }
  }

  next();
}
