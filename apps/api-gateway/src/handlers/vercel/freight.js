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

import { getSupabaseAdmin, getAuthedUserId } from "../_shared/supabase.js";
import { processCancellationPipeline, processCompletionPipeline } from "../_shared/orders/orderCompletionPipeline.js";
import { calcQuickPriceUZS, enrichMatchesWithVehiclesAndStats, extractLatLng, fallbackMatchVehicles, getBody, insertStatusEvent, json, pickLatLng, toPoint } from "./freight.shared.js";

export default async function freightHandler(req, res) {
  const sb = getSupabaseAdmin();
  const body = getBody(req);
  const action = String(body.action || "");

  try {
    // =====================
    // Cargo (Client)
    // =====================
    if (action === "create_cargo") {
      const ownerUserId = (await getAuthedUserId(req, sb)) || body.user_id || body.userId || body.ownerUserId || body.ownerId;
      const pickup = pickLatLng(body.pickup);
      const dropoff = pickLatLng(body.dropoff);
      if (!ownerUserId) return json(res, 400, { error: "user_id required" });
      if (!pickup || !dropoff) return json(res, 400, { error: "pickup/dropoff latlng required" });

      const row = {
        user_id: ownerUserId,
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
      await insertStatusEvent(sb, { cargoId: data.id, status: "posted", actorId: ownerUserId, note: "created" });
      return json(res, 200, { ok: true, data });
    }

    if (action === "cancel_cargo") {
      const cargoId = body.cargoId;
      const actorId = (await getAuthedUserId(req, sb)) || body.actorId || null;
      if (!cargoId) return json(res, 400, { error: "cargoId required" });
      const { data, error } = await sb.from("cargo_orders").update({ status: "cancelled" }).eq("id", cargoId).select("*").single();
      if (error) throw error;
      const pipeline = await processCancellationPipeline(sb, { sourceTable: 'cargo_orders', sourceId: cargoId });
      await insertStatusEvent(sb, { cargoId, status: "cancelled", actorId, note: "cancel" });
      return json(res, 200, { ok: true, data, pipeline });
    }

    if (action === "cargo_status") {
      const cargoId = body.cargoId;
      if (!cargoId) return json(res, 400, { error: "cargoId required" });
      const { data: cargo, error } = await sb.from("cargo_orders").select("*").eq("id", cargoId).single();
      if (error) throw error;
      const { data: offers } = await sb
        .from("cargo_offers")
        .select("id,price,eta_minutes,note,status,created_at,vehicle_id,driver_user_id")
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
        if (!error && Array.isArray(data)) {
          let enriched = await enrichMatchesWithVehiclesAndStats(sb, data);
          if (cargo?.cargo_type) {
            enriched = (enriched || []).filter((m) => String(m?.vehicle?.body_type || '') === String(cargo.cargo_type));
          }
          return json(res, 200, { ok: true, data: enriched });
        }
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
      const enriched = await enrichMatchesWithVehiclesAndStats(sb, matched);
      return json(res, 200, { ok: true, data: enriched });
    }

    if (action === "list_offers") {
      const cargoId = body.cargoId;
      if (!cargoId) return json(res, 400, { error: "cargoId required" });
      const { data, error } = await sb
        .from("cargo_offers")
        .select("id,price,eta_minutes,note,status,created_at,vehicle_id,driver_user_id")
        .eq("cargo_id", cargoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json(res, 200, { ok: true, data: data || [] });
    }

    if (action === "accept_offer") {
      const cargoId = body.cargoId;
      const offerId = body.offerId;
      const ownerUserId = (await getAuthedUserId(req, sb)) || body.user_id || body.userId || body.ownerId || null;
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

      await insertStatusEvent(sb, { cargoId, status: "driver_selected", actorId: ownerUserId, note: "offer accepted" });
      return json(res, 200, { ok: true, cargo, offer: accepted });
    }

    // =====================
    // Vehicle (Driver)
    // =====================
    if (action === "upsert_vehicle") {
      const driverId = (await getAuthedUserId(req, sb)) || body.driverId;
      if (!driverId) return json(res, 400, { error: "driverId required" });

      const row = {
        user_id: driverId,
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
        .select("id,user_id,body_type,capacity_kg,capacity_m3,route_from_point,route_to_point,current_point")
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
        if (c.cargo_type && String(c.cargo_type) !== String(v.body_type)) continue;

        const cf = extractLatLng(c.from_point);
        const ct = extractLatLng(c.to_point);
        if (!cf) continue;

        const dFrom = haversineKm(vf.lat, vf.lng, cf.lat, cf.lng);
        if (dFrom > radiusKm) continue;

        const dTo = vt && ct ? haversineKm(vt.lat, vt.lng, ct.lat, ct.lng) : 0;
        const dRoute = ct ? haversineKm(cf.lat, cf.lng, ct.lat, ct.lng) : 0;
        const score = 100 - Math.min(dFrom, 100) - Math.min(dTo, 100);
        out.push({ cargo: c, score, dist_from_km: dFrom, dist_to_km: dTo, dist_route_km: dRoute });
      }
      out.sort((a, b) => (b.score || 0) - (a.score || 0));
      return json(res, 200, { ok: true, data: out.slice(0, 60) });
    }

    if (action === "quick_offer") {
      const cargoId = body.cargoId;
      const vehicleId = body.vehicleId;
      const driverId = (await getAuthedUserId(req, sb)) || body.driverId;
      const etaMinutes = body.etaMinutes ?? 20;
      const note = body.note || "Tez taklif";
      if (!cargoId || !vehicleId || !driverId) return json(res, 400, { error: "cargoId, vehicleId, driverId required" });

      // Load cargo + vehicle for distance & weight
      const { data: cargo, error: ce } = await sb
        .from("cargo_orders")
        .select("id,weight_kg,from_point,to_point,status")
        .eq("id", cargoId)
        .single();
      if (ce) throw ce;

      const { data: vehicle, error: ve } = await sb
        .from("vehicles")
.select("id,user_id,current_point,route_from_point,route_to_point")
        .eq("id", vehicleId)
        .single();
      if (ve) throw ve;

      // Compute distance km (best effort)
      const cf = extractLatLng(cargo.from_point);
      const ct = extractLatLng(cargo.to_point);
      const vf = extractLatLng(vehicle.route_from_point) || extractLatLng(vehicle.current_point);
      const vt = extractLatLng(vehicle.route_to_point);

      const dFrom = (cf && vf) ? haversineKm(cf.lat, cf.lng, vf.lat, vf.lng) : 0;
      const dRoute = (cf && ct) ? haversineKm(cf.lat, cf.lng, ct.lat, ct.lng) : 0;
      const dTo = (ct && vt) ? haversineKm(ct.lat, ct.lng, vt.lat, vt.lng) : 0;

      // Use route distance primarily
      const distKm = Number.isFinite(dRoute) && dRoute > 0 ? dRoute : (Number.isFinite(dFrom) ? dFrom : 0);
      const price = calcQuickPriceUZS({ distKm, weightKg: cargo.weight_kg });

      const row = {
        cargo_id: cargoId,
        vehicle_id: vehicleId,
        driver_user_id: driverId,
        price,
        eta_minutes: etaMinutes,
        note,
        status: "sent",
      };

      try {
        const { error } = await sb.from("cargo_offers").insert(row);
        if (error) throw error;
      } catch (e) {
        return json(res, 400, { error: e?.message || "Offer insert error" });
      }

      // update cargo status if still posted
      try {
        if (cargo.status === "posted") {
          await sb.from("cargo_orders").update({ status: "offering" }).eq("id", cargoId);
          await insertStatusEvent(sb, { cargoId, status: "offering", actorId: driverId, note: "Offer received" });
        }
      } catch {}

      return json(res, 200, { ok: true, data: { price, distKm, distFromKm: dFrom, distToKm: dTo } });
    }


    if (action === "create_offer") {
      const cargoId = body.cargoId;
      const vehicleId = body.vehicleId;
      const driverId = (await getAuthedUserId(req, sb)) || body.driverId;
      const price = Number(body.price);
      if (!cargoId || !vehicleId || !driverId) return json(res, 400, { error: "cargoId, vehicleId, driverId required" });
      if (!Number.isFinite(price) || price <= 0) return json(res, 400, { error: "price must be > 0" });

      const row = {
        cargo_id: cargoId,
        vehicle_id: vehicleId,
        driver_user_id: driverId,
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
      const actorId = (await getAuthedUserId(req, sb)) || body.actorId || null;
      const allowed = new Set(["loading", "in_transit", "delivered", "closed"]);
      if (!cargoId || !allowed.has(status)) return json(res, 400, { error: "cargoId + valid status required" });
      const { data, error } = await sb.from("cargo_orders").update({ status }).eq("id", cargoId).select("*").single();
      if (error) throw error;
      let pipeline = null;
      if (status === 'delivered' || status === 'closed') {
        pipeline = await processCompletionPipeline(sb, { sourceTable: 'cargo_orders', sourceId: cargoId });
      }
      await insertStatusEvent(sb, { cargoId, status, actorId, note: "driver update" });
      return json(res, 200, { ok: true, data, pipeline });
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
