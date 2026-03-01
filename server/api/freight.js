/**
 * server/api/freight.js
 * UniGo: Yuk tashish (Cargo marketplace) API
 *
 * NOTE:
 * - Taxi/order logikasiga tegilmaydi.
 * - Supabase’da quyidagi jadvallar bo‘lishi kerak (minimal):
 *   - vehicles
 *   - cargo_orders
 *   - cargo_offers
 *   - cargo_status_events (ixtiyoriy)
 *   - cargo_tracking_points (ixtiyoriy)
 */

import { getSupabaseAdmin } from "../_shared/supabase.js";
import { haversineKm } from "../_shared/geo.js";

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function getBody(req) {
  return req.body && typeof req.body === "object" ? req.body : {};
}

function toPoint(lat, lng) {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  // WKT: POINT(lng lat)
  return `POINT(${lo} ${la})`;
}

function pickLatLng(obj) {
  if (!obj) return null;
  if (obj.latlng && typeof obj.latlng === "object") return obj.latlng;
  if (Number.isFinite(obj.lat) && Number.isFinite(obj.lng)) return { lat: obj.lat, lng: obj.lng };
  return null;
}

async function insertStatusEvent(sb, { cargoId, status, actorId, note }) {
  try {
    await sb.from("cargo_status_events").insert({ cargo_id: cargoId, status, actor_id: actorId || null, note: note || null });
  } catch {
    // status log bo‘lmasa ham ishlayversin
  }
}

function extractLatLng(pointVal) {
  if (!pointVal) return null;
  // Supabase might return: { type: 'Point', coordinates: [lng, lat] }
  if (typeof pointVal === "object" && Array.isArray(pointVal.coordinates) && pointVal.coordinates.length >= 2) {
    return { lng: Number(pointVal.coordinates[0]), lat: Number(pointVal.coordinates[1]) };
  }
  // Or string like "POINT(lng lat)"
  if (typeof pointVal === "string") {
    const m = pointVal.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/i);
    if (m) return { lng: Number(m[1]), lat: Number(m[2]) };
  }
  return null;
}

async function fallbackMatchVehicles(sb, { cargo, radiusKm = 30 }) {
  const { data: vehicles, error } = await sb
    .from("vehicles")
    .select("id,driver_id,body_type,capacity_kg,capacity_m3,is_online,route_from_point,route_to_point,current_point,route_depart_at,photo_urls,title,plate_number")
    .eq("is_online", true)
    .limit(200);
  if (error) throw error;

  const from = cargo?.from_latlng;
  const to = cargo?.to_latlng;
  if (!from || !to) return [];

  const results = [];
  for (const v of vehicles || []) {
    const capKg = Number(v.capacity_kg || 0);
    const capM3 = Number(v.capacity_m3 || 0);
    if (capKg < Number(cargo.weight_kg || 0)) continue;
    if (capM3 < Number(cargo.volume_m3 || 0)) continue;

    const vf = extractLatLng(v.route_from_point) || extractLatLng(v.current_point);
    const vt = extractLatLng(v.route_to_point);
    if (!vf) continue;

    const dFrom = haversineKm(from.lat, from.lng, vf.lat, vf.lng);
    if (dFrom > radiusKm) continue;
    const dTo = vt ? haversineKm(to.lat, to.lng, vt.lat, vt.lng) : 0;
    const score = 100 - Math.min(dFrom, 100) - Math.min(dTo, 100);
    results.push({
      vehicle_id: v.id,
      driver_id: v.driver_id,
      score,
      dist_from_km: dFrom,
      dist_to_km: dTo,
      vehicle: v,
    });
  }

  results.sort((a, b) => (b.score || 0) - (a.score || 0));
  return results.slice(0, 50);
}

export default async function freightHandler(req, res) {
  const sb = getSupabaseAdmin();
  const body = getBody(req);
  const action = String(body.action || "");

  try {
    // =====================
    // Cargo (Client)
    // =====================
    if (action === "create_cargo") {
      const ownerId = body.ownerId;
      const pickup = pickLatLng(body.pickup);
      const dropoff = pickLatLng(body.dropoff);
      if (!ownerId) return json(res, 400, { error: "ownerId required" });
      if (!pickup || !dropoff) return json(res, 400, { error: "pickup/dropoff latlng required" });

      const row = {
        owner_id: ownerId,
        title: body.title || body.cargoName || null,
        description: body.note || null,
        cargo_type: body.cargoType || null,
        weight_kg: Number(body.weightKg || 0) || 0,
        volume_m3: Number(body.volumeM3 || 0) || 0,
        from_address: body.pickup?.address || null,
        to_address: body.dropoff?.address || null,
        from_point: toPoint(pickup.lat, pickup.lng),
        to_point: toPoint(dropoff.lat, dropoff.lng),
        pickup_at: body.pickupAt || null,
        budget: body.budget ?? null,
        status: "posted",
      };

      const { data, error } = await sb.from("cargo_orders").insert(row).select("*").single();
      if (error) throw error;
      await insertStatusEvent(sb, { cargoId: data.id, status: "posted", actorId: ownerId, note: "created" });
      return json(res, 200, { ok: true, data });
    }

    if (action === "cancel_cargo") {
      const cargoId = body.cargoId;
      const actorId = body.actorId || null;
      if (!cargoId) return json(res, 400, { error: "cargoId required" });
      const { data, error } = await sb.from("cargo_orders").update({ status: "cancelled" }).eq("id", cargoId).select("*").single();
      if (error) throw error;
      await insertStatusEvent(sb, { cargoId, status: "cancelled", actorId, note: "cancel" });
      return json(res, 200, { ok: true, data });
    }

    if (action === "cargo_status") {
      const cargoId = body.cargoId;
      if (!cargoId) return json(res, 400, { error: "cargoId required" });
      const { data: cargo, error } = await sb.from("cargo_orders").select("*").eq("id", cargoId).single();
      if (error) throw error;
      const { data: offers } = await sb
        .from("cargo_offers")
        .select("id,price,eta_minutes,note,status,created_at,vehicle_id,driver_id")
        .eq("cargo_id", cargoId)
        .order("created_at", { ascending: false })
        .limit(50);
      return json(res, 200, { ok: true, cargo, offers: offers || [] });
    }

    if (action === "match_vehicles") {
      const cargoId = body.cargoId;
      const radiusKm = Number(body.radiusKm || 30) || 30;
      if (!cargoId) return json(res, 400, { error: "cargoId required" });

      const { data: cargo, error: ce } = await sb
        .from("cargo_orders")
        .select("id,weight_kg,volume_m3,from_point,to_point")
        .eq("id", cargoId)
        .single();
      if (ce) throw ce;

      // 1) Try RPC if exists
      try {
        const { data, error } = await sb.rpc("match_vehicles_for_cargo", { p_cargo_id: cargoId, p_radius_km: radiusKm });
        if (!error && Array.isArray(data)) return json(res, 200, { ok: true, data });
      } catch {
        // ignore
      }

      // 2) Fallback: best effort
      const from = extractLatLng(cargo.from_point);
      const to = extractLatLng(cargo.to_point);
      const matched = await fallbackMatchVehicles(sb, {
        cargo: {
          weight_kg: cargo.weight_kg,
          volume_m3: cargo.volume_m3,
          from_latlng: from ? { lat: from.lat, lng: from.lng } : null,
          to_latlng: to ? { lat: to.lat, lng: to.lng } : null,
        },
        radiusKm,
      });
      return json(res, 200, { ok: true, data: matched });
    }

    if (action === "list_offers") {
      const cargoId = body.cargoId;
      if (!cargoId) return json(res, 400, { error: "cargoId required" });
      const { data, error } = await sb
        .from("cargo_offers")
        .select("id,price,eta_minutes,note,status,created_at,vehicle_id,driver_id")
        .eq("cargo_id", cargoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json(res, 200, { ok: true, data: data || [] });
    }

    if (action === "accept_offer") {
      const cargoId = body.cargoId;
      const offerId = body.offerId;
      const ownerId = body.ownerId || null;
      if (!cargoId || !offerId) return json(res, 400, { error: "cargoId & offerId required" });

      const { data: accepted, error: ae } = await sb
        .from("cargo_offers")
        .update({ status: "accepted" })
        .eq("id", offerId)
        .select("*")
        .single();
      if (ae) throw ae;

      try {
        await sb.from("cargo_offers").update({ status: "rejected" }).eq("cargo_id", cargoId).neq("id", offerId);
      } catch {}

      const { data: cargo, error: ce } = await sb
        .from("cargo_orders")
        .update({ status: "driver_selected", selected_offer_id: offerId })
        .eq("id", cargoId)
        .select("*")
        .single();
      if (ce) throw ce;

      await insertStatusEvent(sb, { cargoId, status: "driver_selected", actorId: ownerId, note: "offer accepted" });
      return json(res, 200, { ok: true, cargo, offer: accepted });
    }

    // =====================
    // Vehicle (Driver)
    // =====================
    if (action === "upsert_vehicle") {
      const driverId = body.driverId;
      if (!driverId) return json(res, 400, { error: "driverId required" });

      const row = {
        driver_id: driverId,
        title: body.title || null,
        body_type: body.bodyType || body.body_type || "other",
        capacity_kg: Number(body.capacityKg || body.capacity_kg || 0) || 0,
        capacity_m3: Number(body.capacityM3 || body.capacity_m3 || 0) || 0,
        plate_number: body.plateNumber || body.plate_number || null,
        photo_urls: Array.isArray(body.photoUrls) ? body.photoUrls : undefined,
      };

      if (body.vehicleId) {
        const { data, error } = await sb.from("vehicles").update(row).eq("id", body.vehicleId).select("*").single();
        if (error) throw error;
        return json(res, 200, { ok: true, data });
      }
      const { data, error } = await sb.from("vehicles").insert(row).select("*").single();
      if (error) throw error;
      return json(res, 200, { ok: true, data });
    }

    if (action === "set_vehicle_online") {
      const vehicleId = body.vehicleId;
      const isOnline = !!body.isOnline;
      if (!vehicleId) return json(res, 400, { error: "vehicleId required" });

      const current = pickLatLng(body.current);
      const routeFrom = pickLatLng(body.routeFrom);
      const routeTo = pickLatLng(body.routeTo);

      const patch = {
        is_online: isOnline,
        current_point: current ? toPoint(current.lat, current.lng) : undefined,
        current_updated_at: current ? new Date().toISOString() : undefined,
        route_from_point: routeFrom ? toPoint(routeFrom.lat, routeFrom.lng) : undefined,
        route_to_point: routeTo ? toPoint(routeTo.lat, routeTo.lng) : undefined,
        route_depart_at: body.routeDepartAt || null,
      };

      const { data, error } = await sb.from("vehicles").update(patch).eq("id", vehicleId).select("*").single();
      if (error) throw error;
      return json(res, 200, { ok: true, data });
    }

    if (action === "list_vehicle_cargo") {
      const vehicleId = body.vehicleId;
      const radiusKm = Number(body.radiusKm || 30) || 30;
      if (!vehicleId) return json(res, 400, { error: "vehicleId required" });

      const { data: v, error: ve } = await sb
        .from("vehicles")
        .select("id,capacity_kg,capacity_m3,route_from_point,route_to_point,current_point")
        .eq("id", vehicleId)
        .single();
      if (ve) throw ve;

      const vf = extractLatLng(v.route_from_point) || extractLatLng(v.current_point);
      const vt = extractLatLng(v.route_to_point);
      if (!vf) return json(res, 200, { ok: true, data: [] });

      const { data: cargos, error: ce } = await sb
        .from("cargo_orders")
        .select("id,title,description,cargo_type,weight_kg,volume_m3,from_address,to_address,from_point,to_point,pickup_at,budget,status,created_at")
        .in("status", ["posted", "offering"])
        .order("created_at", { ascending: false })
        .limit(200);
      if (ce) throw ce;

      const out = [];
      for (const c of cargos || []) {
        if (Number(c.weight_kg || 0) > Number(v.capacity_kg || 0)) continue;
        if (Number(c.volume_m3 || 0) > Number(v.capacity_m3 || 0)) continue;

        const cf = extractLatLng(c.from_point);
        const ct = extractLatLng(c.to_point);
        if (!cf) continue;

        const dFrom = haversineKm(vf.lat, vf.lng, cf.lat, cf.lng);
        if (dFrom > radiusKm) continue;

        const dTo = vt && ct ? haversineKm(vt.lat, vt.lng, ct.lat, ct.lng) : 0;
        const score = 100 - Math.min(dFrom, 100) - Math.min(dTo, 100);
        out.push({ cargo: c, score, dist_from_km: dFrom, dist_to_km: dTo });
      }
      out.sort((a, b) => (b.score || 0) - (a.score || 0));
      return json(res, 200, { ok: true, data: out.slice(0, 60) });
    }

    if (action === "create_offer") {
      const cargoId = body.cargoId;
      const vehicleId = body.vehicleId;
      const driverId = body.driverId;
      const price = Number(body.price);
      if (!cargoId || !vehicleId || !driverId) return json(res, 400, { error: "cargoId, vehicleId, driverId required" });
      if (!Number.isFinite(price) || price <= 0) return json(res, 400, { error: "price must be > 0" });

      const row = {
        cargo_id: cargoId,
        vehicle_id: vehicleId,
        driver_id: driverId,
        price,
        eta_minutes: body.etaMinutes ?? null,
        note: body.note || null,
        status: "sent",
      };
      const { data, error } = await sb.from("cargo_offers").insert(row).select("*").single();
      if (error) throw error;

      try {
        await sb.from("cargo_orders").update({ status: "offering" }).eq("id", cargoId).in("status", ["posted", "offering"]);
      } catch {}

      await insertStatusEvent(sb, { cargoId, status: "offering", actorId: driverId, note: "offer sent" });
      return json(res, 200, { ok: true, data });
    }

    if (action === "driver_update_status") {
      const cargoId = body.cargoId;
      const status = String(body.status || "");
      const actorId = body.actorId || null;
      const allowed = new Set(["loading", "in_transit", "delivered", "closed"]);
      if (!cargoId || !allowed.has(status)) return json(res, 400, { error: "cargoId + valid status required" });
      const { data, error } = await sb.from("cargo_orders").update({ status }).eq("id", cargoId).select("*").single();
      if (error) throw error;
      await insertStatusEvent(sb, { cargoId, status, actorId, note: "driver update" });
      return json(res, 200, { ok: true, data });
    }

    if (action === "track") {
      const cargoId = body.cargoId;
      const vehicleId = body.vehicleId || null;
      const p = pickLatLng(body.point);
      if (!cargoId || !p) return json(res, 400, { error: "cargoId + point required" });
      try {
        const row = {
          cargo_id: cargoId,
          vehicle_id: vehicleId,
          point: toPoint(p.lat, p.lng),
          speed_kmh: body.speedKmh ?? null,
        };
        await sb.from("cargo_tracking_points").insert(row);
      } catch {
        // table bo‘lmasa ham ishlayversin
      }
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { error: "Unknown freight action", action });
  } catch (e) {
    return json(res, 500, { error: e?.message || "Freight API error" });
  }
}
