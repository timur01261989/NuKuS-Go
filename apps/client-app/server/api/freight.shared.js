import { haversineKm } from "../_shared/geo.js";

export function calcQuickPriceUZS({ distKm = 0, weightKg = 0 }) {
  const baseFee = 30000;
  const perKm = 4000;
  const perTon = 15000;
  const price = baseFee + Number(distKm || 0) * perKm + (Number(weightKg || 0) / 1000) * perTon;
  return Math.max(0, Math.round(price / 1000) * 1000);
}

export async function enrichMatchesWithVehiclesAndStats(sb, matches) {
  const arr = Array.isArray(matches) ? matches : [];
  if (arr.length === 0) return arr;

  const needVehicles = arr.some((m) => !m.vehicle && (m.vehicle_id || m.vehicleId));
  if (needVehicles) {
    const ids = arr.map((m) => m.vehicle_id || m.vehicleId).filter(Boolean);
    if (ids.length) {
      const { data: vehicles } = await sb
        .from("vehicles")
        .select("id,user_id,body_type,capacity_kg,capacity_m3,is_online,is_verified,current_point,current_updated_at,route_from_point,route_to_point,route_depart_at,photo_urls,title,plate_number")
        .in("id", ids);
      const map = new Map((vehicles || []).map((v) => [v.id, v]));
      for (const m of arr) {
        const vid = m.vehicle_id || m.vehicleId;
        if (!m.vehicle && vid && map.has(vid)) m.vehicle = map.get(vid);
      }
    }
  }

  const driverIds = Array.from(
    new Set(
      arr
        .map((m) => m.driver_user_id || m.driverId || m.vehicle?.user_id)
        .filter(Boolean)
        .map(String)
    )
  ).slice(0, 50);

  const stats = Object.create(null);

  try {
    const { data: ratings } = await sb
      .from("cargo_ratings")
      .select("to_user,rating")
      .in("to_user", driverIds)
      .limit(5000);

    for (const r of ratings || []) {
      const k = String(r.to_user);
      if (!stats[k]) stats[k] = { deliveredCount: 0, ratingAvg: null, ratingCount: 0, lastActiveAt: null, isVerified: null };
      const v = Number(r.rating);
      if (Number.isFinite(v)) {
        stats[k].ratingCount += 1;
        stats[k].ratingAvg = (stats[k].ratingAvg ?? 0) + v;
      }
    }
    for (const k of Object.keys(stats)) {
      if (stats[k].ratingCount > 0) stats[k].ratingAvg = Number((stats[k].ratingAvg / stats[k].ratingCount).toFixed(2));
    }
  } catch {}

  try {
    const { data: evs } = await sb
      .from("cargo_status_events")
      .select("actor_id,status")
      .in("actor_id", driverIds)
      .in("status", ["delivered", "closed"])
      .limit(5000);

    for (const e of evs || []) {
      const k = String(e.actor_id);
      if (!stats[k]) stats[k] = { deliveredCount: 0, ratingAvg: null, ratingCount: 0, lastActiveAt: null, isVerified: null };
      stats[k].deliveredCount += 1;
    }
  } catch {}

  for (const m of arr) {
    const did = String(m.driver_user_id || m.driverId || m.vehicle?.user_id || "");
    if (!did) continue;
    if (!stats[did]) stats[did] = { deliveredCount: 0, ratingAvg: null, ratingCount: 0, lastActiveAt: null, isVerified: null };
    const v = m.vehicle || {};
    if (v.current_updated_at && !stats[did].lastActiveAt) stats[did].lastActiveAt = v.current_updated_at;
    if (typeof v.is_verified === "boolean") stats[did].isVerified = v.is_verified;
  }

  for (const m of arr) {
    const did = String(m.driver_user_id || m.driverId || m.vehicle?.user_id || "");
    if (!did) continue;
    m.driver_stats = stats[did] || null;
  }
  return arr;
}

export function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export function getBody(req) {
  return req.body && typeof req.body === "object" ? req.body : {};
}

export function toPoint(lat, lng) {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  return `POINT(${lo} ${la})`;
}

export function pickLatLng(obj) {
  if (!obj) return null;
  if (obj.latlng && typeof obj.latlng === "object") return obj.latlng;
  if (Number.isFinite(obj.lat) && Number.isFinite(obj.lng)) return { lat: obj.lat, lng: obj.lng };
  return null;
}

export async function insertStatusEvent(sb, { cargoId, status, actorId, note }) {
  try {
    await sb.from("cargo_status_events").insert({ cargo_id: cargoId, status, actor_id: actorId || null, note: note || null });
  } catch {}
}

export function extractLatLng(pointVal) {
  if (!pointVal) return null;
  if (typeof pointVal === "object" && Array.isArray(pointVal.coordinates) && pointVal.coordinates.length >= 2) {
    return { lng: Number(pointVal.coordinates[0]), lat: Number(pointVal.coordinates[1]) };
  }
  if (typeof pointVal === "string") {
    const m = pointVal.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/i);
    if (m) return { lng: Number(m[1]), lat: Number(m[2]) };
  }
  return null;
}

export async function fallbackMatchVehicles(sb, { cargo, radiusKm = 30 }) {
  const { data: vehicles, error } = await sb
    .from("vehicles")
    .select("id,user_id,body_type,capacity_kg,capacity_m3,is_online,is_verified,current_point,current_updated_at,route_from_point,route_to_point,route_depart_at,photo_urls,title,plate_number")
    .eq("is_online", true)
    .limit(200);
  if (error) throw error;

  const from = cargo?.from_latlng;
  const to = cargo?.to_latlng;
  if (!from || !to) return [];

  const results = [];
  for (const v of vehicles || []) {
    const current = extractLatLng(v.current_point);
    if (!current) continue;
    const d1 = haversineKm(from.lat, from.lng, current.lat, current.lng);
    if (d1 > Number(radiusKm || 30)) continue;
    const routeFrom = extractLatLng(v.route_from_point);
    const routeTo = extractLatLng(v.route_to_point);
    const routeHintKm =
      routeFrom && routeTo
        ? haversineKm(from.lat, from.lng, routeFrom.lat, routeFrom.lng) +
          haversineKm(to.lat, to.lng, routeTo.lat, routeTo.lng)
        : null;
    results.push({
      vehicle_id: v.id,
      driver_user_id: v.user_id,
      vehicle: v,
      match_score: routeHintKm == null ? Math.max(0, 100 - d1 * 2) : Math.max(0, 100 - routeHintKm * 2),
      distance_km: Number(d1.toFixed(1)),
    });
  }

  results.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  return results.slice(0, 50);
}
