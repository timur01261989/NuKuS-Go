const ORDER_SELECT = [
  "id",
  "client_id",
  "driver_id",
  "service_type",
  "status",
  "pickup",
  "dropoff",
  "price_uzs",
  "surge_multiplier",
  "distance_m",
  "duration_s",
  "comment",
  "payment_method",
  "car_type",
  "options",
  "created_at",
  "updated_at",
].join(",");

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function getMethod(req) {
  return String(req.method || "GET").toUpperCase();
}

function toText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function toNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeLng(raw) {
  return raw ?? raw === 0 ? raw : null;
}

function isValidLatitude(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

function normalizeLocationObject(input) {
  if (!input || typeof input !== "object") return null;

  const address =
    toText(
      input.address ??
        input.label ??
        input.name ??
        input.title ??
        input.display_name ??
        input.location_name ??
        input.description
    ) || null;

  const lat = toNumber(
    input.lat ??
      input.latitude ??
      input.y ??
      (Array.isArray(input.latlng) ? input.latlng[0] : null) ??
      (Array.isArray(input.coords) ? input.coords[0] : null)
  );

  const lng = toNumber(
    input.lng ??
      input.lon ??
      input.longitude ??
      input.x ??
      (Array.isArray(input.latlng) ? input.latlng[1] : null) ??
      (Array.isArray(input.coords) ? input.coords[1] : null)
  );

  if (!isValidLatitude(lat) || !isValidLongitude(lng)) return null;

  return {
    address,
    lat,
    lng,
  };
}

function normalizePickup(body) {
  return (
    normalizeLocationObject(body?.pickup) ||
    normalizeLocationObject(body?.from) ||
    normalizeLocationObject(body?.from_location) ||
    normalizeLocationObject(body?.fromLocation) ||
    normalizeLocationObject(body?.pickup_location) ||
    normalizeLocationObject(body?.pickupLocation) ||
    normalizeLocationObject({
      address: body?.pickup_address ?? body?.from_address ?? body?.fromAddress ?? body?.pickupAddress,
      lat: body?.pickup_lat ?? body?.from_lat ?? body?.fromLat,
      lng: body?.pickup_lng ?? body?.pickup_lon ?? body?.pickup_long ?? body?.from_lng ?? body?.from_lon ?? body?.fromLong,
    })
  );
}

function normalizeDropoff(body) {
  return (
    normalizeLocationObject(body?.dropoff) ||
    normalizeLocationObject(body?.to) ||
    normalizeLocationObject(body?.to_location) ||
    normalizeLocationObject(body?.toLocation) ||
    normalizeLocationObject(body?.dropoff_location) ||
    normalizeLocationObject(body?.dropoffLocation) ||
    normalizeLocationObject({
      address: body?.dropoff_address ?? body?.to_address ?? body?.toAddress ?? body?.dropoffAddress,
      lat: body?.dropoff_lat ?? body?.to_lat ?? body?.toLat,
      lng: body?.dropoff_lng ?? body?.dropoff_lon ?? body?.dropoff_long ?? body?.to_lng ?? body?.to_lon ?? body?.toLong,
    })
  );
}

function buildNormalizedPayload(body) {
  const pickup = normalizePickup(body);
  const dropoff = normalizeDropoff(body);

  const paymentMethod = toText(body?.payment_method ?? body?.paymentMethod) || null;
  const serviceType = toText(body?.service_type ?? body?.serviceType) || "city_taxi";
  const carType = toText(body?.car_type ?? body?.carType ?? body?.tariff ?? body?.tarif) || null;
  const comment = toText(body?.comment ?? body?.note ?? body?.notes) || null;

  const surgeMultiplier = toNumber(body?.surge_multiplier ?? body?.surgeMultiplier) ?? 1;
  const priceUzs = toNumber(body?.price_uzs ?? body?.priceUzs ?? body?.price);
  const distanceM = toNumber(body?.distance_m ?? body?.distanceM ?? body?.distance);
  const durationS = toNumber(body?.duration_s ?? body?.durationS ?? body?.duration);

  const options = body?.options && typeof body.options === "object" ? body.options : {};
  const meta = body?.meta && typeof body.meta === "object" ? body.meta : {};

  return {
    client_id: body?.client_id ?? body?.user_id ?? body?.userId ?? null,
    driver_id: body?.driver_id ?? body?.driverId ?? null,
    service_type: serviceType,
    status: toText(body?.status) || "searching",
    pickup,
    dropoff: dropoff || null,
    payment_method: paymentMethod,
    car_type: carType,
    comment,
    price_uzs: priceUzs,
    surge_multiplier: surgeMultiplier,
    distance_m: distanceM,
    duration_s: durationS,
    options,
    meta,
  };
}

function buildResponseOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    client_id: row.client_id ?? null,
    driver_id: row.driver_id ?? null,
    service_type: row.service_type ?? "city_taxi",
    status: row.status ?? null,
    pickup: row.pickup ?? null,
    dropoff: row.dropoff ?? null,
    payment_method: row.payment_method ?? null,
    car_type: row.car_type ?? null,
    comment: row.comment ?? null,
    price_uzs: row.price_uzs ?? null,
    surge_multiplier: row.surge_multiplier ?? 1,
    distance_m: row.distance_m ?? null,
    duration_s: row.duration_s ?? null,
    options: row.options ?? {},
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;

  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", resolve);
    req.on("error", reject);
  });

  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function getSupabaseAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceRole) {
    throw new Error("SUPABASE_URL_or_SERVICE_ROLE_missing");
  }

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function handleGetById(supabase, body) {
  const orderId = toText(body?.order_id ?? body?.orderId ?? body?.id);
  if (!orderId) {
    return { status: 400, payload: { ok: false, error: "order_id kerak" } };
  }

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .single();

  if (error) {
    return { status: 500, payload: { ok: false, error: error.message } };
  }

  return {
    status: 200,
    payload: {
      ok: true,
      order: buildResponseOrder(data),
      id: data?.id ?? null,
      orderId: data?.id ?? null,
      data: data ? { id: data.id } : null,
    },
  };
}

async function handleActiveOrder(supabase, body) {
  const clientId = toText(body?.client_id ?? body?.user_id ?? body?.clientId ?? body?.userId);
  if (!clientId) {
    return { status: 400, payload: { ok: false, error: "client_id kerak" } };
  }

  const activeStatuses = ["searching", "offered", "accepted", "arrived", "in_progress"];

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("client_id", clientId)
    .in("status", activeStatuses)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { status: 500, payload: { ok: false, error: error.message } };
  }

  if (!data) {
    return {
      status: 200,
      payload: {
        ok: true,
        order: null,
        id: null,
        orderId: null,
        data: null,
      },
    };
  }

  return {
    status: 200,
    payload: {
      ok: true,
      order: buildResponseOrder(data),
      id: data.id,
      orderId: data.id,
      data: { id: data.id },
    },
  };
}

async function handleCancel(supabase, body) {
  const orderId = toText(body?.order_id ?? body?.orderId ?? body?.id);
  if (!orderId) {
    return { status: 400, payload: { ok: false, error: "order_id kerak" } };
  }

  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select(ORDER_SELECT)
    .single();

  if (error) {
    return { status: 500, payload: { ok: false, error: error.message } };
  }

  return {
    status: 200,
    payload: {
      ok: true,
      order: buildResponseOrder(data),
      id: data?.id ?? null,
      orderId: data?.id ?? null,
      data: data ? { id: data.id } : null,
    },
  };
}

async function handleCreateOrder(supabase, body) {
  const payload = buildNormalizedPayload(body);

  if (!payload.pickup) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "pickup kerak",
      },
    };
  }

  const insertPayload = {
    client_id: payload.client_id,
    driver_id: payload.driver_id,
    service_type: payload.service_type,
    status: payload.status,
    pickup: payload.pickup,
    dropoff: payload.dropoff,
    payment_method: payload.payment_method,
    car_type: payload.car_type,
    comment: payload.comment,
    price_uzs: payload.price_uzs,
    surge_multiplier: payload.surge_multiplier,
    distance_m: payload.distance_m,
    duration_s: payload.duration_s,
    options: payload.options,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("orders")
    .insert(insertPayload)
    .select(ORDER_SELECT)
    .single();

  if (error) {
    return {
      status: 500,
      payload: {
        ok: false,
        error: error.message,
      },
    };
  }

  return {
    status: 200,
    payload: {
      ok: true,
      order: buildResponseOrder(data),
      id: data?.id ?? null,
      orderId: data?.id ?? null,
      data: data ? { id: data.id } : null,
    },
  };
}

export default async function handler(req, res) {
  try {
    const method = getMethod(req);
    const body = await readBody(req);
    const action = toText(body?.action).toLowerCase();
    const supabase = await getSupabaseAdmin();

    if (method === "GET") {
      const result = await handleGetById(supabase, body);
      return json(res, result.status, result.payload);
    }

    if (method !== "POST") {
      return json(res, 405, { ok: false, error: "method_not_allowed" });
    }

    if (action === "get") {
      const result = await handleGetById(supabase, body);
      return json(res, result.status, result.payload);
    }

    if (action === "active") {
      const result = await handleActiveOrder(supabase, body);
      return json(res, result.status, result.payload);
    }

    if (action === "cancel") {
      const result = await handleCancel(supabase, body);
      return json(res, result.status, result.payload);
    }

    const result = await handleCreateOrder(supabase, body);
    return json(res, result.status, result.payload);
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error?.message || "unknown_order_error",
    });
  }
}
