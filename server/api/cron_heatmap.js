/**
 * server/api/cron_heatmap.js
 * Stage-6: Heatmap generator (SAFE / additive)
 *
 * POST /api/cron_heatmap  { window_minutes?: 30 }
 * GET  /api/cron_heatmap?window_minutes=30
 *
 * - Aggregates recent orders into demand_hotspots table.
 * - Gated by FEATURE_HEATMAP=true (default false).
 * - Best-effort: if tables/columns are missing, returns ok:false without breaking other APIs.
 */

import { json, badRequest, serverError, nowIso } from "../_shared/cors.js";
import { getSupabaseAdmin } from "../_shared/supabase.js";

function envTrue(name, defaultVal = false) {
  const v = process.env[name];
  if (v == null || String(v).trim() === "") return defaultVal;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function hasEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function roundGrid(value, step) {
  const n = toNum(value);
  if (n == null) return null;
  return Math.round(n / step) * step;
}

function buildGeoKey(lat, lng, step) {
  const a = roundGrid(lat, step);
  const b = roundGrid(lng, step);
  if (a == null || b == null) return null;
  return `${a.toFixed(4)}:${b.toFixed(4)}:${step}`;
}

export default async function handler(req, res) {
  try {
    if (!envTrue("FEATURE_HEATMAP", false)) {
      return json(res, 200, { ok: false, skipped: true, reason: "FEATURE_HEATMAP disabled" });
    }
    if (!hasEnv()) return badRequest(res, "SUPABASE env yo'q");

    const sb = getSupabaseAdmin();

    const url = new URL(req.url, "http://localhost");
    const action = url.searchParams.get("action");
    if (String(action || "").toLowerCase() === "list") {
      const serviceType = url.searchParams.get("service_type") || null;
      const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || 50) || 50));
      let q = sb.from("demand_hotspots").select("*").order("demand_score", { ascending: false }).limit(limit);
      if (serviceType) q = q.eq("service_type", serviceType);
      const { data, error } = await q;
      if (error) return json(res, 200, { ok: false, error: error.message });
      return json(res, 200, { ok: true, hotspots: data || [] });
    }


    const qWin = url.searchParams.get("window_minutes");
    const bodyWin = (req.body && typeof req.body === "object") ? req.body.window_minutes : undefined;

    const windowMinutes = Math.max(5, Math.min(120, Number(bodyWin ?? qWin ?? 30) || 30));
    const step = 0.01; // ~1.1km grid (safe default)

    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    // Pull recent orders with pickup JSON (lat/lng inside)
    const { data: orders, error } = await sb
      .from("orders")
      .select("id, service_type, pickup, created_at, status")
      .gte("created_at", since);

    if (error) return json(res, 200, { ok: false, error: error.message });

    const buckets = new Map(); // key => {count, lat, lng, service_type}
    for (const o of (orders || [])) {
      const pickup = o.pickup || {};
      const lat = pickup.lat ?? pickup.latitude ?? pickup[0];
      const lng = pickup.lng ?? pickup.longitude ?? pickup[1];
      const key = buildGeoKey(lat, lng, step);
      if (!key) continue;
      const service = String(o.service_type || "taxi");

      const k = `${key}|${service}`;
      const existing = buckets.get(k);
      if (!existing) {
        buckets.set(k, {
          geokey: key,
          service_type: service,
          center_lat: roundGrid(lat, step),
          center_lng: roundGrid(lng, step),
          demand_count: 1,
        });
      } else {
        existing.demand_count += 1;
      }
    }

    const rows = Array.from(buckets.values()).map((b) => ({
      geokey: b.geokey,
      service_type: b.service_type,
      center_lat: b.center_lat,
      center_lng: b.center_lng,
      window_start: nowIso(),
      window_minutes: windowMinutes,
      demand_count: b.demand_count,
      demand_score: b.demand_count, // simple score (can be weighted later)
      updated_at: nowIso(),
    }));

    if (rows.length === 0) return json(res, 200, { ok: true, updated: 0, window_minutes: windowMinutes });

    // Upsert into demand_hotspots (unique geokey+service_type)
    const { error: upErr } = await sb
      .from("demand_hotspots")
      .upsert(rows, { onConflict: "geokey,service_type" });

    if (upErr) return json(res, 200, { ok: false, error: upErr.message, updated: 0 });

    return json(res, 200, { ok: true, updated: rows.length, window_minutes: windowMinutes });
  } catch (e) {
    return serverError(res, e);
  }
}
