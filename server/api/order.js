const ORDER_SELECT = [
  "id",
  "client_id",
  "user_id",
  "driver_id",
  "service_type",
  "status",
  "pickup",
  "dropoff",
  "route_meta",
  "cargo_title",
  "cargo_weight_kg",
  "cargo_volume_m3",
  "passenger_count",
  "note",
  "payment_method",
  "price_uzs",
  "commission_uzs",
  "driver_payout_uzs",
  "offered_at",
  "accepted_at",
  "arrived_at",
  "started_at",
  "completed_at",
  "cancelled_at",
  "cancel_reason",
  "created_at",
  "updated_at",
  "car_type",
  "comment",
  "pickup_lat",
  "pickup_lng",
  "dropoff_lat",
  "dropoff_lng",
  "distance_km",
  "price",
  "distance_m",
  "duration_s",
  "surge_multiplier",
  "options",
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

function toInteger(value) {
  const n = toNumber(value);
  if (n == null) return null;
  return Number.isInteger(n) ? n : Math.round(n);
}

function normalizeUuid(value) {
  const text = toText(value);
  return text || null;
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

function normalizeJsonObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function buildNormalizedPayload(body) {
  const pickup = normalizePickup(body);
  const dropoff = normalizeDropoff(body);
  const options = normalizeJsonObject(body?.options);
  const meta = normalizeJsonObject(body?.meta);

  const paymentMethod = toText(body?.payment_method ?? body?.paymentMethod) || "cash";
  const serviceType = toText(body?.service_type ?? body?.serviceType) || "taxi";
  const carType = toText(body?.car_type ?? body?.carType ?? body?.tariff ?? body?.tarif) || null;
  const comment = toText(body?.comment ?? body?.note ?? body?.notes) || null;

  const surgeMultiplier = toNumber(body?.surge_multiplier ?? body?.surgeMultiplier) ?? 1;
  const priceUzs = toInteger(body?.price_uzs ?? body?.priceUzs ?? body?.price);
  const distanceM = toInteger(body?.distance_m ?? body?.distanceM ?? body?.distance);
  const durationS = toInteger(body?.duration_s ?? body?.durationS ?? body?.duration);

  const cargoTitle = toText(body?.cargo_title ?? body?.cargoTitle ?? options?.cargoTitle) || null;
  const cargoWeightKg = toNumber(body?.cargo_weight_kg ?? body?.cargoWeightKg ?? options?.cargoWeightKg ?? options?.weightKg);
  const cargoVolumeM3 = toNumber(body?.cargo_volume_m3 ?? body?.cargoVolumeM3 ?? options?.cargoVolumeM3 ?? options?.volumeM3);
  const passengerCount = toInteger(body?.passenger_count ?? body?.passengerCount ?? options?.passengerCount) ?? (serviceType === "taxi" ? 1 : null);

  const normalizedUserId = normalizeUuid(body?.user_id ?? body?.userId ?? body?.client_id ?? body?.clientId);
  const normalizedDriverId = normalizeUuid(body?.driver_id ?? body?.driverId);

  const routeMeta = {
    ...meta,
    options,
    pricing: {
      surge_multiplier: surgeMultiplier,
      distance_m: distanceM,
      duration_s: durationS,
      car_type: carType,
    },
  };

  return {
    user_id: normalizedUserId,
    client_id: normalizedUserId,
    driver_id: normalizedDriverId,
    service_type: serviceType,
    status: toText(body?.status) || "searching",
    pickup,
    dropoff: dropoff || null,
    payment_method: paymentMethod,
    note: comment,
    price_uzs: priceUzs,
    route_meta: routeMeta,
    cargo_title: cargoTitle,
    cargo_weight_kg: cargoWeightKg,
    cargo_volume_m3: cargoVolumeM3,
    passenger_count: passengerCount,
  };
}

function buildResponseOrder(row) {
  if (!row) return null;

  const routeMeta = normalizeJsonObject(row.route_meta);
  const pricing = normalizeJsonObject(routeMeta.pricing);
  const options = normalizeJsonObject(routeMeta.options);

  return {
    id: row.id,
    user_id: row.user_id ?? row.client_id ?? null,
    client_id: row.client_id ?? row.user_id ?? null,
    driver_id: row.driver_id ?? null,
    service_type: row.service_type ?? "taxi",
    status: row.status ?? null,
    pickup: row.pickup ?? null,
    dropoff: row.dropoff ?? null,
    payment_method: row.payment_method ?? null,
    car_type: row.car_type ?? pricing.car_type ?? null,
    comment: row.comment ?? row.note ?? null,
    note: row.note ?? row.comment ?? null,
    price_uzs: row.price_uzs ?? row.price ?? null,
    price: row.price ?? row.price_uzs ?? null,
    surge_multiplier: row.surge_multiplier ?? pricing.surge_multiplier ?? 1,
    distance_m: row.distance_m ?? pricing.distance_m ?? null,
    distance_km: row.distance_km ?? (row.distance_m != null ? Number(row.distance_m) / 1000 : null),
    duration_s: row.duration_s ?? pricing.duration_s ?? null,
    pickup_lat: row.pickup_lat ?? row.pickup?.lat ?? null,
    pickup_lng: row.pickup_lng ?? row.pickup?.lng ?? null,
    dropoff_lat: row.dropoff_lat ?? row.dropoff?.lat ?? null,
    dropoff_lng: row.dropoff_lng ?? row.dropoff?.lng ?? null,
    options: row.options ?? options,
    meta: routeMeta,
    cargo_title: row.cargo_title ?? null,
    cargo_weight_kg: row.cargo_weight_kg ?? null,
    cargo_volume_m3: row.cargo_volume_m3 ?? null,
    passenger_count: row.passenger_count ?? null,
    offered_at: row.offered_at ?? null,
    accepted_at: row.accepted_at ?? null,
    arrived_at: row.arrived_at ?? null,
    started_at: row.started_at ?? null,
    completed_at: row.completed_at ?? null,
    cancelled_at: row.cancelled_at ?? null,
    cancel_reason: row.cancel_reason ?? null,
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

function getBearerToken(req) {
  const h = req?.headers?.authorization || req?.headers?.Authorization || "";
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

async function getAuthedUserId(req, supabase) {
  const token = getBearerToken(req);
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data?.user?.id || null;
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

async function handleActiveOrder(supabase, body, authedUserId = null) {
  const clientId = normalizeUuid(authedUserId ?? body?.user_id ?? body?.userId ?? body?.client_id ?? body?.clientId);
  if (!clientId) {
    return { status: 400, payload: { ok: false, error: "user_id kerak" } };
  }

  const activeStatuses = ["pending", "searching", "offered", "accepted", "arrived", "in_progress", "in_trip"];

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .or(`user_id.eq.${clientId},client_id.eq.${clientId}`)
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

async function handleCancel(supabase, body, authedUserId = null) {
  const orderId = toText(body?.order_id ?? body?.orderId ?? body?.id);
  const cancelReason = toText(body?.cancel_reason ?? body?.cancelReason ?? body?.reason) || null;

  if (!orderId) {
    return { status: 400, payload: { ok: false, error: "order_id kerak" } };
  }

  const patch = {
    status: "cancelled",
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (cancelReason) {
    patch.cancel_reason = cancelReason;
  }

  const { data, error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", orderId)
    .select(ORDER_SELECT)
    .single();

  if (error) {
    return { status: 500, payload: { ok: false, error: error.message } };
  }

  await supabase.from("order_status_history").insert({
    order_id: orderId,
    status: "cancelled",
    changed_by: normalizeUuid(authedUserId ?? body?.user_id ?? body?.userId ?? body?.client_id ?? body?.clientId ?? body?.driver_id ?? body?.driverId),
    note: cancelReason || "Cancelled via API",
  });

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

async function handleCreateOrder(supabase, body, authedUserId = null) {
  const payload = buildNormalizedPayload(body);

  const payloadUserId = payload.user_id ?? payload.client_id ?? null;
  const canonicalUserId = normalizeUuid(authedUserId ?? payloadUserId);

  if (authedUserId && payloadUserId && canonicalUserId !== payloadUserId) {
    return {
      status: 403,
      payload: {
        ok: false,
        error: "token user_id payload user_id bilan mos emas",
      },
    };
  }

  if (!canonicalUserId) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "user_id yuborilishi shart",
      },
    };
  }

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
    user_id: canonicalUserId,
    client_id: canonicalUserId,
    driver_id: payload.driver_id,
    service_type: payload.service_type,
    status: payload.status,
    pickup: payload.pickup,
    dropoff: payload.dropoff,
    payment_method: payload.payment_method,
    note: payload.note,
    comment: payload.note,
    price_uzs: payload.price_uzs,
    price: payload.price_uzs,
    route_meta: payload.route_meta,
    options: payload.route_meta?.options ?? {},
    surge_multiplier: payload.route_meta?.pricing?.surge_multiplier ?? 1,
    distance_m: payload.route_meta?.pricing?.distance_m ?? null,
    distance_km: payload.route_meta?.pricing?.distance_m != null ? Number(payload.route_meta.pricing.distance_m) / 1000 : null,
    duration_s: payload.route_meta?.pricing?.duration_s ?? null,
    car_type: payload.route_meta?.pricing?.car_type ?? null,
    pickup_lat: payload.pickup?.lat ?? null,
    pickup_lng: payload.pickup?.lng ?? null,
    dropoff_lat: payload.dropoff?.lat ?? null,
    dropoff_lng: payload.dropoff?.lng ?? null,
    cargo_title: payload.cargo_title,
    cargo_weight_kg: payload.cargo_weight_kg,
    cargo_volume_m3: payload.cargo_volume_m3,
    passenger_count: payload.passenger_count,
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

  await supabase.from("order_events").insert({
    order_id: data.id,
    actor_user_id: canonicalUserId,
    actor_role: "client",
    event_code: "order.created",
    from_status: null,
    to_status: data.status,
    payload: {
      service_type: data.service_type,
      payment_method: data.payment_method,
    },
  });

  await supabase.from("order_status_history").insert({
    order_id: data.id,
    status: data.status,
    changed_by: canonicalUserId,
    note: "Created via API",
  });

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
    const authedUserId = await getAuthedUserId(req, supabase);

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
      const result = await handleActiveOrder(supabase, body, authedUserId);
      return json(res, result.status, result.payload);
    }

    if (action === "cancel") {
      const result = await handleCancel(supabase, body, authedUserId);
      return json(res, result.status, result.payload);
    }

    const result = await handleCreateOrder(supabase, body, authedUserId);
    return json(res, result.status, result.payload);
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error?.message || "unknown_order_error",
    });
  }
}
