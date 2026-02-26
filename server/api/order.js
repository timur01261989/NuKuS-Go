import { createAdminClient } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

function badRequest(message, details) {
  const e = new Error(message || "Bad Request");
  e.statusCode = 400;
  e.details = details;
  return e;
}

function ok(res, data, status = 200) {
  res.status(status).json(data);
}

function parseNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toPickupDropoff(body) {
  const pickup = {
    address: body.from_address ?? body.pickup_address ?? null,
    lat: parseNumber(body.from_lat ?? body.pickup_lat),
    lng: parseNumber(body.from_lng ?? body.pickup_lng),
    note: body.comment ?? body.note ?? null,
    wishes: body.wishes ?? null,
  };

  const dropoff = {
    address: body.to_address ?? body.dropoff_address ?? null,
    lat: parseNumber(body.to_lat ?? body.dropoff_lat),
    lng: parseNumber(body.to_lng ?? body.dropoff_lng),
    destination_name: body.destination_name ?? null,
  };

  return { pickup, dropoff };
}

function normalizeAction(body) {
  const a = (body?.action || body?.type || "").toString().toLowerCase().trim();
  if (["create", "create_taxi", "create_city", "new"].includes(a)) return "create";
  if (["get", "active", "current"].includes(a)) return "get";
  if (["cancel", "delete"].includes(a)) return "cancel";
  if (["accept"].includes(a)) return "accept";
  if (["complete", "finish", "done"].includes(a)) return "complete";
  return a || "create";
}

export default async function handler(req, res) {
  try {
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const user = await requireAuth(req);
    const body = req.body || {};
    const action = normalizeAction(body);

    const admin = createAdminClient();

    // ---- CREATE ORDER (client) ----
    if (action === "create") {
      const { pickup, dropoff } = toPickupDropoff(body);

      if (!pickup.address || pickup.lat === null || pickup.lng === null) {
        throw badRequest("Pickup is required", "from_address/from_lat/from_lng missing");
      }
      // dropoff can be optional for some taxi flows, but usually required
      if (!dropoff.address || dropoff.lat === null || dropoff.lng === null) {
        throw badRequest("Dropoff is required", "to_address/to_lat/to_lng missing");
      }

      const price = parseNumber(body.fare ?? body.price);
      const distance_km = parseNumber(body.distance_km ?? body.distanceKm);
      const scheduled_at = body.scheduled_time ?? body.scheduled_at ?? null;

      // map ride_type/service_type
      const rideType = (body.ride_type || body.service_type || "taxi").toString().toLowerCase();
      let service_type = "taxi";
      if (["delivery", "freight", "inter_prov", "inter_district"].includes(rideType)) service_type = rideType;
      if (["city", "taxi"].includes(rideType)) service_type = "taxi";

      const insertPayload = {
        passenger_id: user.id,
        service_type,
        pickup,
        dropoff,
        status: "searching",
        price,
        distance_km,
        scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
      };

      const { data, error } = await admin.from("orders").insert(insertPayload).select("*").single();
      if (error) throw error;

      return ok(res, { ok: true, order: data }, 201);
    }

    // ---- GET ACTIVE ORDER (client) ----
    if (action === "get") {
      const { data, error } = await admin
        .from("orders")
        .select("*")
        .eq("passenger_id", user.id)
        .in("status", ["searching", "accepted", "enroute", "arrived", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      return ok(res, { ok: true, order: data?.[0] || null });
    }

    // ---- CANCEL ORDER (client) ----
    if (action === "cancel") {
      const orderId = body.order_id || body.id;
      if (!orderId) throw badRequest("order_id is required");

      const { data, error } = await admin
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId)
        .eq("passenger_id", user.id)
        .select("*")
        .single();

      if (error) throw error;
      return ok(res, { ok: true, order: data });
    }

    // ---- Driver actions (optional) ----
    if (action === "accept") {
      const orderId = body.order_id || body.id;
      if (!orderId) throw badRequest("order_id is required");

      const { data, error } = await admin
        .from("orders")
        .update({ status: "accepted", driver_id: user.id, accepted_at: new Date().toISOString() })
        .eq("id", orderId)
        .is("driver_id", null)
        .select("*")
        .single();

      if (error) throw error;
      return ok(res, { ok: true, order: data });
    }

    if (action === "complete") {
      const orderId = body.order_id || body.id;
      if (!orderId) throw badRequest("order_id is required");

      const { data, error } = await admin
        .from("orders")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", orderId)
        .or(`passenger_id.eq.${user.id},driver_id.eq.${user.id}`)
        .select("*")
        .single();

      if (error) throw error;
      return ok(res, { ok: true, order: data });
    }

    return res.status(400).json({ error: "Unknown action", action });
  } catch (err) {
    const status = err?.statusCode || 500;
    const payload = {
      error: status === 500 ? "A server error has occurred" : err.message,
      details: err?.details || err?.hint || err?.message,
      code: err?.code || null,
    };
    return res.status(status).json(payload);
  }
}
