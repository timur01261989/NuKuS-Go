/**
 * api/order.js
 * ------------------------------------------------------------
 * Supports actions for inter-provincial flow so frontend does NOT write directly to DB.
 *
 * Actions (query for GET, body for POST):
 * - list_inter_prov (GET): list inter-prov ads/orders with filters
 * - list_my_inter_prov_bookings (GET): list bookings for passenger_id (joins orders)
 * - book_inter_prov (POST): create booking request + decrement seats_available (best-effort)
 * - edit_inter_prov_booking (POST): edit seats count for an existing booking (best-effort)
 * - update_inter_prov_booking_seats (POST): alias for edit seats
 * - cancel_booking_request (POST): cancel booking request + restore seats (best-effort)
 * - request_cancel_after_accept (POST): mark cancel_requested (if already accepted/processing)
 * - mark_cancel_requested (POST): helper used by UI
 *
 * Env required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY   (recommended) OR SUPABASE_ANON_KEY (less privileged)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

function sendJson(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function withCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getAction(req, body) {
  return (
    req.query?.action ||
    req.query?.a ||
    body?.action ||
    body?.a ||
    ""
  ).toString();
}

function toISODateRange(dateStr) {
  // expects YYYY-MM-DD
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  } catch {
    return null;
  }
}

async function listInterProv(req, res) {
  const {
    from_region,
    from_district = "",
    to_region,
    to_district = "",
    date = "",
    gender = "all",
    pickup_mode = "all",
  } = req.query || {};

  if (!from_region || !to_region) {
    return sendJson(res, 400, { error: "from_region va to_region shart" });
  }

  let q = supabase
    .from("orders")
    .select("*")
    .eq("service_type", "inter_prov")
    .in("status", ["pending", "booked"])
    .gt("seats_available", 0)
    .eq("from_region", from_region)
    .eq("to_region", to_region)
    .order("scheduled_at", { ascending: true });

  // district wildcard: match exact OR empty
  if (from_district) q = q.or(`from_district.eq.${from_district},from_district.eq.`);
  if (to_district) q = q.or(`to_district.eq.${to_district},to_district.eq.`);

  // gender preference (optional)
  if (gender && gender !== "all") q = q.in("gender_pref", ["all", gender]);

  // pickup mode
  if (pickup_mode && pickup_mode !== "all") q = q.eq("pickup_mode", pickup_mode);

  // date
  if (date) {
    const r = toISODateRange(date);
    if (r) q = q.gte("scheduled_at", r.start).lte("scheduled_at", r.end);
  }

  const { data, error } = await q;
  if (error) return sendJson(res, 500, { error: error.message });

  return sendJson(res, 200, { orders: data || [] });
}

async function listMyBookings(req, res) {
  const passenger_id = (req.query?.passenger_id || "").toString();
  if (!passenger_id) return sendJson(res, 400, { error: "passenger_id shart" });

  const { data, error } = await supabase
    .from("trip_booking_requests")
    .select("*, orders(*)")
    .eq("passenger_id", passenger_id)
    .order("created_at", { ascending: false });

  if (error) return sendJson(res, 500, { error: error.message });

  return sendJson(res, 200, { bookings: data || [] });
}

async function bookInterProv(req, res, body) {
  const orderId = body.orderId || body.adId || body.order_id;
  const passenger_id = body.passenger_id || body.passengerId;
  const seats = Number(body.seats || 1);

  if (!orderId || !passenger_id) {
    return sendJson(res, 400, { error: "orderId/adId va passenger_id shart" });
  }
  if (!Number.isFinite(seats) || seats <= 0) {
    return sendJson(res, 400, { error: "seats noto‘g‘ri" });
  }

  // 1) Read order
  const { data: order, error: ordErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (ordErr || !order) return sendJson(res, 404, { error: "Order topilmadi" });

  const avail = Number(order.seats_available || 0);
  if (avail < seats) return sendJson(res, 400, { error: "Bo‘sh o‘rin yetarli emas" });

  // 2) Create booking request
  const bookingPayload = {
    order_id: orderId,
    passenger_id,
    seats_requested: seats,
    status: "pending",
    passenger_name: body.passenger_name || body.name || null,
    passenger_phone: body.passenger_phone || body.phone || null,
    pickup_mode: body.pickup_mode || null,
    pickup_location: body.pickup_location || null,
  };

  const { data: booking, error: bErr } = await supabase
    .from("trip_booking_requests")
    .insert(bookingPayload)
    .select("*")
    .single();

  if (bErr) return sendJson(res, 500, { error: bErr.message });

  // 3) Decrement seats (best-effort)
  const newAvail = Math.max(0, avail - seats);
  const newStatus = newAvail === 0 ? "booked" : order.status;

  const { error: updErr } = await supabase
    .from("orders")
    .update({ seats_available: newAvail, status: newStatus })
    .eq("id", orderId);

  // If update fails, still return booking (but warn)
  if (updErr) {
    return sendJson(res, 200, {
      booking,
      warning: "Booking yaratildi, lekin seats update xatolik: " + updErr.message,
    });
  }

  return sendJson(res, 200, { booking });
}

async function restoreSeatsForBooking(bookingRow) {
  if (!bookingRow?.order_id) return;
  const seats = Number(bookingRow.seats_requested || 1);

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", bookingRow.order_id)
    .single();

  if (!order) return;

  const avail = Number(order.seats_available || 0);
  const total = Number(order.seats_total || order.seats_count || 999999);
  const newAvail = Math.min(total, avail + seats);

  await supabase
    .from("orders")
    .update({ seats_available: newAvail, status: "pending" })
    .eq("id", bookingRow.order_id);
}

async function cancelBooking(req, res, body) {
  const booking_id = body.booking_id || body.id;
  const passenger_id = body.passenger_id || body.passengerId;

  if (!booking_id) return sendJson(res, 400, { error: "booking_id shart" });

  const q = supabase.from("trip_booking_requests").select("*").eq("id", booking_id).single();
  const { data: booking, error } = await q;
  if (error || !booking) return sendJson(res, 404, { error: "Booking topilmadi" });

  if (passenger_id && booking.passenger_id !== passenger_id) {
    // service-role key should be used, but we keep a guard
    return sendJson(res, 403, { error: "Ruxsat yo‘q" });
  }

  const { error: updErr } = await supabase
    .from("trip_booking_requests")
    .update({ status: "cancelled" })
    .eq("id", booking_id);

  if (updErr) return sendJson(res, 500, { error: updErr.message });

  // restore seats best-effort
  await restoreSeatsForBooking(booking);

  return sendJson(res, 200, { ok: true });
}

async function markCancelRequested(req, res, body) {
  const booking_id = body.booking_id || body.id;
  if (!booking_id) return sendJson(res, 400, { error: "booking_id shart" });

  const { error } = await supabase
    .from("trip_booking_requests")
    .update({ status: "cancel_requested" })
    .eq("id", booking_id);

  if (error) return sendJson(res, 500, { error: error.message });
  return sendJson(res, 200, { ok: true });
}

async function editBookingSeats(req, res, body) {
  const booking_id = body.booking_id || body.id;
  const seats_requested = Number(body.seats_requested || body.seats || 1);
  if (!booking_id) return sendJson(res, 400, { error: "booking_id shart" });
  if (!Number.isFinite(seats_requested) || seats_requested <= 0) {
    return sendJson(res, 400, { error: "seats_requested noto‘g‘ri" });
  }

  // Read booking + order
  const { data: booking, error: bErr } = await supabase
    .from("trip_booking_requests")
    .select("*")
    .eq("id", booking_id)
    .single();
  if (bErr || !booking) return sendJson(res, 404, { error: "Booking topilmadi" });

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", booking.order_id)
    .single();
  if (!order) return sendJson(res, 404, { error: "Order topilmadi" });

  const oldSeats = Number(booking.seats_requested || 1);
  const delta = seats_requested - oldSeats;

  // If increasing seats -> must have availability
  if (delta > 0 && Number(order.seats_available || 0) < delta) {
    return sendJson(res, 400, { error: "Bo‘sh o‘rin yetarli emas" });
  }

  // Update booking
  const { error: updB } = await supabase
    .from("trip_booking_requests")
    .update({ seats_requested })
    .eq("id", booking_id);
  if (updB) return sendJson(res, 500, { error: updB.message });

  // Update seats available best-effort
  const newAvail = Math.max(0, Number(order.seats_available || 0) - delta);
  const newStatus = newAvail === 0 ? "booked" : "pending";

  await supabase
    .from("orders")
    .update({ seats_available: newAvail, status: newStatus })
    .eq("id", booking.order_id);

  return sendJson(res, 200, { ok: true });
}


/* ============================================================
 * INTER-DISTRICT (Tumanlararo / shahar ichida tuman yo‘nalishi)
 * ------------------------------------------------------------
 * New actions:
 * - district_offers (GET/POST): returns driver offers for fromDistrict->toDistrict
 * - create_inter_district (POST): creates an order row in "orders" (service_type="inter_district")
 * Notes:
 * - Narx masofa (km) asosida hisoblanadi (keyin siz o‘zgartirasiz).
 * - Agar DB insert xato bo‘lsa ham, server 200 qaytaradi (frontend oq ekran bo‘lmasin).
 * ============================================================ */

const DISTRICT_COORDS = {
  "Nukus": { lat: 42.4617, lng: 59.6166 },
  "Xo'jayli": { lat: 42.4042, lng: 59.4403 },
  "Qo'ng'irot": { lat: 43.0520, lng: 58.8530 },
  "Chimboy": { lat: 42.9410, lng: 59.7690 },
  "To'rtko'l": { lat: 41.55, lng: 61.0167 },
  "Beruniy": { lat: 41.6917, lng: 60.7520 },
  "Amudaryo": { lat: 42.0175, lng: 60.0010 },
};

function haversineKmPoints(a, b) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const q = s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(q)));
}

function estimateDistrictPrice(distanceKm) {
  const km = Math.max(0, Number(distanceKm) || 0);
  const base = 7000;
  const perKm = 1200;
  const min = 15000;
  return Math.max(min, Math.round(base + km * perKm));
}

function makeDistrictOffers({ fromDistrict, toDistrict, filters = {} }) {
  const a = DISTRICT_COORDS[fromDistrict] || DISTRICT_COORDS["Nukus"];
  const b = DISTRICT_COORDS[toDistrict] || DISTRICT_COORDS["Xo'jayli"];
  const distanceKm = haversineKmPoints(a, b);
  const durationMin = (distanceKm / 50) * 60;
  const basePrice = estimateDistrictPrice(distanceKm);

  const cars = [
    { carModel: "Cobalt", carNumber: "95A 123 AB", ac: true, trunk: true },
    { carModel: "Gentra", carNumber: "90B 777 BB", ac: true, trunk: false },
    { carModel: "Nexia 3", carNumber: "01C 555 CC", ac: false, trunk: false },
    { carModel: "Lacetti", carNumber: "85D 888 DD", ac: false, trunk: true },
  ];
  const names = ["Aziz", "Sardor", "Diyor", "Javohir", "Rustam", "Ibrohim"];

  let offers = cars.map((c, i) => ({
    id: `district_${i}`,
    driverId: `district_driver_${i}`,
    driverName: names[i % names.length],
    rating: 4.6 + (i % 4) * 0.1,
    carModel: c.carModel,
    carNumber: c.carNumber,
    ac: c.ac,
    trunk: c.trunk,
    price: basePrice + i * 2500,
    etaMin: Math.max(3, Math.round(durationMin * 0.25) + i),
    meta: { distanceKm, durationMin },
  }));

  if (filters?.ac) offers = offers.filter((o) => o.ac);
  if (filters?.trunk) offers = offers.filter((o) => o.trunk);

  return { offers, distanceKm, durationMin, priceBase: basePrice };
}

async function districtOffers(req, res, body) {
  const fromDistrict = (req.query?.fromDistrict || body?.fromDistrict || "Nukus").toString();
  const toDistrict = (req.query?.toDistrict || body?.toDistrict || "").toString();
  const filters = body?.filters || {};
  if (!toDistrict) return sendJson(res, 400, { error: "toDistrict shart" });

  const result = makeDistrictOffers({ fromDistrict, toDistrict, filters });
  return sendJson(res, 200, result);
}

async function createInterDistrict(req, res, body) {
  const fromDistrict = (body?.fromDistrict || "Nukus").toString();
  const toDistrict = (body?.toDistrict || "").toString();
  const seats = Number(body?.seats || 1);
  const filters = body?.filters || {};
  if (!toDistrict) return sendJson(res, 400, { error: "toDistrict shart" });

  const result = makeDistrictOffers({ fromDistrict, toDistrict, filters });
  const distance_km = Number(body?.distance_km || result.distanceKm);
  const duration_min = Number(body?.duration_min || result.durationMin);
  const price = Number(body?.price || estimateDistrictPrice(distance_km));

  // Create order row (best-effort). If table/columns differ, return created=false but still 200.
  try {
    const { data, error } = await supabase
      .from("orders")
      .insert([{
        service_type: "inter_district",
        status: "pending",
        from_region: body?.from_region || null,
        to_region: body?.to_region || null,
        from_district: fromDistrict,
        to_district: toDistrict,
        seats_requested: seats,
        seats_available: 0,
        distance_km,
        duration_min,
        price,
        filters,
        scheduled_at: new Date().toISOString(),
      }])
      .select("*")
      .single();

    if (error) {
      return sendJson(res, 200, { created: false, warning: error.message, distance_km, duration_min, price });
    }
    return sendJson(res, 200, { created: true, id: data?.id, order: data });
  } catch (e) {
    return sendJson(res, 200, { created: false, warning: e?.message || "insert failed", distance_km, duration_min, price });
  }
}



/* ============================================================
 * TAXI / CITY TAXI
 * ------------------------------------------------------------
 * New actions (POST):
 * - create / create_taxi / create_city / new : create taxi order (in "orders")
 * - cancel_taxi / cancel_order : cancel taxi order
 * - get_taxi / get_order : get taxi order by id
 * - active_taxi : get active taxi order for client_id (best-effort)
 *
 * Notes:
 * - We keep a "best-effort" insertion strategy so DB column differences
 *   won't break the client flow during rollout.
 * ============================================================ */


function getAuthUid(req) {
  try {
    const auth = req.headers?.authorization || req.headers?.Authorization;
    if (!auth || typeof auth !== "string") return null;
    const m = auth.match(/Bearer\s+(.+)/i);
    if (!m) return null;
    const token = m[1].trim();
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (payloadB64.length % 4)) % 4);
    const payloadJson = Buffer.from(payloadB64 + pad, "base64").toString("utf8");
    const payload = JSON.parse(payloadJson);
    return payload.sub || payload.user_id || payload.uid || null;
  } catch {
    return null;
  }
}

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickLatLng(obj) {
  if (!obj) return null;
  const lat = numOrNull(obj.lat ?? obj.latitude ?? obj.pickup_lat ?? obj.from_lat);
  const lng = numOrNull(obj.lng ?? obj.lon ?? obj.longitude ?? obj.pickup_lng ?? obj.from_lng);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

function buildPoint({ lat, lng, address, extra }) {
  if (lat == null || lng == null) return null;
  const p = { lat, lng };
  if (address) p.address = address;
  if (extra && typeof extra === "object") Object.assign(p, extra);
  return p;
}

function resolvePickupDropoff(body) {
  // Accept multiple payload shapes without changing frontend behavior.
  const pickupObj = body.pickup || body.from || body.pickup_point || null;
  const dropoffObj = body.dropoff || body.to || body.dropoff_point || null;

  const pLL =
    pickLatLng(pickupObj) ||
    pickLatLng({ lat: body.pickup_lat, lng: body.pickup_lng }) ||
    pickLatLng({ lat: body.from_lat, lng: body.from_lng });

  const dLL =
    pickLatLng(dropoffObj) ||
    pickLatLng({ lat: body.dropoff_lat, lng: body.dropoff_lng }) ||
    pickLatLng({ lat: body.to_lat, lng: body.to_lng });

  const pickup = buildPoint({
    lat: pLL?.lat,
    lng: pLL?.lng,
    address: body.pickup_address || pickupObj?.address || pickupObj?.label || null,
    extra: pickupObj && typeof pickupObj === "object" ? pickupObj : null,
  });

  const dropoff = buildPoint({
    lat: dLL?.lat,
    lng: dLL?.lng,
    address: body.dropoff_address || dropoffObj?.address || dropoffObj?.label || null,
    extra: dropoffObj && typeof dropoffObj === "object" ? dropoffObj : null,
  });

  return { pickup, dropoff };
}

async function createTaxiOrder(req, res, body) {
  const client_id =
    (body.client_id || body.passenger_id || body.user_id || body.clientId || getAuthUid(req) || "").toString();
  if (!client_id) return sendJson(res, 400, { error: "client_id (yoki passenger_id) shart" });

  const { pickup, dropoff } = resolvePickupDropoff(body);
  if (!pickup) return sendJson(res, 400, { error: "pickup koordinata shart" });

  const route = body.route || body.polyline || body.routeInfo || null;
  const notes = body.notes || body.note || body.comment || null;

  const price_estimate =
    numOrNull(body.price_estimate ?? body.priceEstimate ?? body.price) ??
    null;

  const currency = (body.currency || "UZS").toString();

  // Preferred schema (based on your "orders" table snapshot):
  const baseInsert = {
    client_id,
    driver_id: body.driver_id || body.driverId || null,
    status: body.status || "created",
    pickup,
    dropoff: dropoff || null,
    route: route || null,
    notes,
    price_estimate,
    currency,
    requested_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Some projects also have service_type in the same table; keep it if present.
  const withServiceType = { ...baseInsert, service_type: body.service_type || "taxi" };

  // Best-effort: try with service_type first, then without.
  let inserted = null;
  let lastErr = null;

  for (const payload of [withServiceType, baseInsert]) {
    const { data, error } = await supabase
      .from("orders")
      .insert([payload])
      .select("*")
      .single();

    if (!error && data) {
      inserted = data;
      break;
    }
    lastErr = error;
  }

  if (!inserted) {
    return sendJson(res, 200, {
      created: false,
      warning: lastErr?.message || "insert failed",
      hint: "orders table ustunlari mos kelmayapti yoki RLS bloklayapti",
    });
  }

  return sendJson(res, 200, { created: true, order: inserted, id: inserted.id });
}

async function cancelTaxiOrder(req, res, body) {
  const id = (body.id || body.order_id || body.orderId || "").toString();
  if (!id) return sendJson(res, 400, { error: "id/order_id shart" });

  const payload = {
    status: "cancelled",
    canceled_at: new Date().toISOString(),
    cancel_reason: body.cancel_reason || body.reason || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return sendJson(res, 500, { error: error.message });
  return sendJson(res, 200, { ok: true, order: data });
}

async function getTaxiOrder(req, res, body) {
  const id = (req.query?.id || body?.id || body?.order_id || body?.orderId || "").toString();
  if (!id) return sendJson(res, 400, { error: "id/order_id shart" });

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return sendJson(res, 404, { error: error.message });
  return sendJson(res, 200, { order: data });
}

async function activeTaxiOrder(req, res, body) {
  const client_id = (req.query?.client_id || body?.client_id || body?.passenger_id || "").toString();
  if (!client_id) return sendJson(res, 400, { error: "client_id/passenger_id shart" });

  // Try common "active" statuses; adjust later if your enum differs.
  const activeStatuses = ["created", "searching", "accepted", "arrived", "started", "in_progress"];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("client_id", client_id)
    .in("status", activeStatuses)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return sendJson(res, 500, { error: error.message });
  return sendJson(res, 200, { order: (data && data[0]) || null });
}



export default async function handler(req, res) {
  if (withCors(req, res)) return;

  const body = req.method === "POST" ? await readBody(req) : {};
  const action = getAction(req, body);

  try {
    if (req.method === "GET") {
      if (action === "list_inter_prov") return await listInterProv(req, res);
      if (action === "list_my_inter_prov_bookings") return await listMyBookings(req, res);
      if (action === "district_offers") return await districtOffers(req, res, body);
      return sendJson(res, 400, { error: "Noto‘g‘ri action (GET)" });
    }

    if (req.method === "POST") {
      if (action === "book_inter_prov") return await bookInterProv(req, res, body);
      if (action === "edit_inter_prov_booking") return await editBookingSeats(req, res, body);
      if (action === "update_inter_prov_booking_seats") return await editBookingSeats(req, res, body);
      if (action === "cancel_booking_request") return await cancelBooking(req, res, body);
      if (action === "request_cancel_after_accept") return await markCancelRequested(req, res, body);
      if (action === "mark_cancel_requested") return await markCancelRequested(req, res, body);
      if (action === "district_offers") return await districtOffers(req, res, body);
      if (action === "create_inter_district") return await createInterDistrict(req, res, body);

      // TAXI actions (backward-compat with client)
      if (action === "create" || action === "create_taxi" || action === "create_city" || action === "new") {
        return await createTaxiOrder(req, res, body);
      }
      if (action === "cancel_taxi" || action === "cancel_order" || action === "cancel") {
        return await cancelTaxiOrder(req, res, body);
      }
      if (action === "get_taxi" || action === "get_order" || action === "get") {
        return await getTaxiOrder(req, res, body);
      }
      if (action === "active_taxi" || action === "active") {
        return await activeTaxiOrder(req, res, body);
      }
            return sendJson(res, 400, { error: "Noto‘g‘ri action (POST)" });
    }

    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (e) {
    return sendJson(res, 500, { error: e?.message || "Server error" });
  }
}
