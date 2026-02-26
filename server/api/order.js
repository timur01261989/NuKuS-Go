/**
 * /api/order
 * Vercel Serverless Function (Node.js)
 *
 * What this endpoint does:
 * - Accepts an order payload from the client (Vite app)
 * - Validates only the truly required fields
 * - Maps client field names to DB-friendly names
 * - Inserts into Supabase "orders" table using SERVICE_ROLE key (if present)
 *
 * REQUIRED env vars (Vercel Project Settings -> Environment Variables):
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY   (recommended for server-side insert)
 * Optional:
 *   - SUPABASE_ANON_KEY           (fallback if service role not set)
 *
 * NOTE:
 * Do NOT expose SERVICE_ROLE key to the browser. It's safe only on server-side.
 */

import { createClient } from "@supabase/supabase-js";

/** Basic CORS */
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/** Safely parse JSON body */
function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body || "{}");
  } catch {
    return {};
  }
}

function isNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

function normalizeNullableString(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function normalizeNullableNumber(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function errorJson(res, status, message, extra = {}) {
  res.status(status).json({
    code: status,
    message,
    ...extra,
  });
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return errorJson(res, 405, "Method not allowed. Use POST.");
  }

  const body = parseBody(req);

  // ---- Accept BOTH client styles:
  // Vite client sends: pickup_location, dropoff_location, from_lat, from_lng, to_lat, to_lng, price, status, service_type, ...
  // Some older code may send: from_location / to_location
  const pickupLocation =
    normalizeNullableString(body.pickup_location) ||
    normalizeNullableString(body.from_location) ||
    normalizeNullableString(body.fromLocation);

  const dropoffLocation =
    normalizeNullableString(body.dropoff_location) ||
    normalizeNullableString(body.to_location) ||
    normalizeNullableString(body.toLocation);

  const fromLat = normalizeNullableNumber(body.from_lat);
  const fromLng = normalizeNullableNumber(body.from_lng);

  // Destination is OPTIONAL (user may order "start" without destination)
  const toLat = normalizeNullableNumber(body.to_lat);
  const toLng = normalizeNullableNumber(body.to_lng);

  const price = normalizeNullableNumber(body.price);
  const status = normalizeNullableString(body.status) || "new";
  const serviceType = normalizeNullableString(body.service_type);

  // Hard requirement: pickup location + coords + price.
  // If your DB has different NOT NULL constraints, change here (not in the client!).
  const missing = [];
  if (!pickupLocation) missing.push("pickup_location");
  if (!isNumber(fromLat)) missing.push("from_lat");
  if (!isNumber(fromLng)) missing.push("from_lng");
  if (!isNumber(price)) missing.push("price");

  if (missing.length) {
    return errorJson(res, 400, "Missing required fields", { missing });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
    return errorJson(
      res,
      500,
      "Supabase env vars are not configured on the server",
      {
        required_env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)"],
      }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey || anonKey);

  // Build insert object:
  // IMPORTANT: Keep keys aligned with your "orders" table columns.
  // If your table uses different column names, rename them here.
  const orderRow = {
    // Locations
    pickup_location: pickupLocation,
    dropoff_location: dropoffLocation,

    // Coordinates
    from_lat: fromLat,
    from_lng: fromLng,
    to_lat: toLat,
    to_lng: toLng,

    // Core fields
    price,
    status,
    service_type: serviceType,

    // Optional fields the client may send
    action: normalizeNullableString(body.action),
    comment: normalizeNullableString(body.comment),
    distance_km: normalizeNullableNumber(body.distance_km),
    order_for: normalizeNullableString(body.order_for),
    other_phone: normalizeNullableString(body.other_phone),
    pickup_entrance: normalizeNullableString(body.pickup_entrance),
    scheduled_time: body.scheduled_time ?? null,
    waypoints: Array.isArray(body.waypoints) ? body.waypoints : [],
    wishes: typeof body.wishes === "object" && body.wishes !== null ? body.wishes : null,
  };

  try {
    const { data, error } = await supabase
      .from("orders")
      .insert(orderRow)
      .select("*")
      .single();

    if (error) {
      return errorJson(res, 500, "Supabase insert failed", {
        supabase_error: error.message,
        hint:
          "Check your 'orders' table columns + NOT NULL constraints. If a column is required in DB, send it or set a default.",
      });
    }

    // Always return an id so the client doesn't crash
    return res.status(200).json({
      id: data?.id ?? data?.order_id ?? null,
      order: data,
    });
  } catch (e) {
    return errorJson(res, 500, "Server error", {
      details: e instanceof Error ? e.message : String(e),
    });
  }
}
