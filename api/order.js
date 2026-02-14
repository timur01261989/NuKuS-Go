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

function json(res, status, body) {
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
    return json(res, 400, { error: "from_region va to_region shart" });
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
  if (error) return json(res, 500, { error: error.message });

  return json(res, 200, { orders: data || [] });
}

async function listMyBookings(req, res) {
  const passenger_id = (req.query?.passenger_id || "").toString();
  if (!passenger_id) return json(res, 400, { error: "passenger_id shart" });

  const { data, error } = await supabase
    .from("trip_booking_requests")
    .select("*, orders(*)")
    .eq("passenger_id", passenger_id)
    .order("created_at", { ascending: false });

  if (error) return json(res, 500, { error: error.message });

  return json(res, 200, { bookings: data || [] });
}

async function bookInterProv(req, res, body) {
  const orderId = body.orderId || body.adId || body.order_id;
  const passenger_id = body.passenger_id || body.passengerId;
  const seats = Number(body.seats || 1);

  if (!orderId || !passenger_id) {
    return json(res, 400, { error: "orderId/adId va passenger_id shart" });
  }
  if (!Number.isFinite(seats) || seats <= 0) {
    return json(res, 400, { error: "seats noto‘g‘ri" });
  }

  // 1) Read order
  const { data: order, error: ordErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (ordErr || !order) return json(res, 404, { error: "Order topilmadi" });

  const avail = Number(order.seats_available || 0);
  if (avail < seats) return json(res, 400, { error: "Bo‘sh o‘rin yetarli emas" });

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

  if (bErr) return json(res, 500, { error: bErr.message });

  // 3) Decrement seats (best-effort)
  const newAvail = Math.max(0, avail - seats);
  const newStatus = newAvail === 0 ? "booked" : order.status;

  const { error: updErr } = await supabase
    .from("orders")
    .update({ seats_available: newAvail, status: newStatus })
    .eq("id", orderId);

  // If update fails, still return booking (but warn)
  if (updErr) {
    return json(res, 200, {
      booking,
      warning: "Booking yaratildi, lekin seats update xatolik: " + updErr.message,
    });
  }

  return json(res, 200, { booking });
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

  if (!booking_id) return json(res, 400, { error: "booking_id shart" });

  const q = supabase.from("trip_booking_requests").select("*").eq("id", booking_id).single();
  const { data: booking, error } = await q;
  if (error || !booking) return json(res, 404, { error: "Booking topilmadi" });

  if (passenger_id && booking.passenger_id !== passenger_id) {
    // service-role key should be used, but we keep a guard
    return json(res, 403, { error: "Ruxsat yo‘q" });
  }

  const { error: updErr } = await supabase
    .from("trip_booking_requests")
    .update({ status: "cancelled" })
    .eq("id", booking_id);

  if (updErr) return json(res, 500, { error: updErr.message });

  // restore seats best-effort
  await restoreSeatsForBooking(booking);

  return json(res, 200, { ok: true });
}

async function markCancelRequested(req, res, body) {
  const booking_id = body.booking_id || body.id;
  if (!booking_id) return json(res, 400, { error: "booking_id shart" });

  const { error } = await supabase
    .from("trip_booking_requests")
    .update({ status: "cancel_requested" })
    .eq("id", booking_id);

  if (error) return json(res, 500, { error: error.message });
  return json(res, 200, { ok: true });
}

async function editBookingSeats(req, res, body) {
  const booking_id = body.booking_id || body.id;
  const seats_requested = Number(body.seats_requested || body.seats || 1);
  if (!booking_id) return json(res, 400, { error: "booking_id shart" });
  if (!Number.isFinite(seats_requested) || seats_requested <= 0) {
    return json(res, 400, { error: "seats_requested noto‘g‘ri" });
  }

  // Read booking + order
  const { data: booking, error: bErr } = await supabase
    .from("trip_booking_requests")
    .select("*")
    .eq("id", booking_id)
    .single();
  if (bErr || !booking) return json(res, 404, { error: "Booking topilmadi" });

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", booking.order_id)
    .single();
  if (!order) return json(res, 404, { error: "Order topilmadi" });

  const oldSeats = Number(booking.seats_requested || 1);
  const delta = seats_requested - oldSeats;

  // If increasing seats -> must have availability
  if (delta > 0 && Number(order.seats_available || 0) < delta) {
    return json(res, 400, { error: "Bo‘sh o‘rin yetarli emas" });
  }

  // Update booking
  const { error: updB } = await supabase
    .from("trip_booking_requests")
    .update({ seats_requested })
    .eq("id", booking_id);
  if (updB) return json(res, 500, { error: updB.message });

  // Update seats available best-effort
  const newAvail = Math.max(0, Number(order.seats_available || 0) - delta);
  const newStatus = newAvail === 0 ? "booked" : "pending";

  await supabase
    .from("orders")
    .update({ seats_available: newAvail, status: newStatus })
    .eq("id", booking.order_id);

  return json(res, 200, { ok: true });
}

export default async function handler(req, res) {
  if (withCors(req, res)) return;

  const body = req.method === "POST" ? await readBody(req) : {};
  const action = getAction(req, body);

  try {
    if (req.method === "GET") {
      if (action === "list_inter_prov") return await listInterProv(req, res);
      if (action === "list_my_inter_prov_bookings") return await listMyBookings(req, res);
      return json(res, 400, { error: "Noto‘g‘ri action (GET)" });
    }

    if (req.method === "POST") {
      if (action === "book_inter_prov") return await bookInterProv(req, res, body);
      if (action === "edit_inter_prov_booking") return await editBookingSeats(req, res, body);
      if (action === "update_inter_prov_booking_seats") return await editBookingSeats(req, res, body);
      if (action === "cancel_booking_request") return await cancelBooking(req, res, body);
      if (action === "request_cancel_after_accept") return await markCancelRequested(req, res, body);
      if (action === "mark_cancel_requested") return await markCancelRequested(req, res, body);
      return json(res, 400, { error: "Noto‘g‘ri action (POST)" });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    return json(res, 500, { error: e?.message || "Server error" });
  }
}
