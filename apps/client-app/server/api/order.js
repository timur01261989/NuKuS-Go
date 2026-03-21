import {
  ORDER_SELECT,
  buildNormalizedPayload,
  buildResponseOrder,
  getMethod,
  getQueryValue,
  json,
  normalizeUuid,
  readBody,
  toText,
} from './order.shared.js';

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


async function handleGetById(supabase, body, req = null, authedUserId = null) {
  const orderId = toText(
    body?.order_id ??
      body?.orderId ??
      body?.id ??
      getQueryValue(req, "order_id") ??
      getQueryValue(req, "orderId") ??
      getQueryValue(req, "id")
  );

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

  const canonicalUserId = normalizeUuid(authedUserId);
  if (canonicalUserId) {
    const ownerId = normalizeUuid(data?.user_id);
    const driverId = normalizeUuid(data?.driver_id);
    const canAccess = canonicalUserId === ownerId || canonicalUserId === driverId;
    if (!canAccess) {
      return { status: 403, payload: { ok: false, error: "forbidden" } };
    }
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
  const userId = normalizeUuid(authedUserId ?? body?.user_id ?? body?.userId);
  if (!userId) {
    return { status: 200, payload: { ok: true, order: null, id: null, orderId: null, data: null } };
  }

  const activeStatuses = ["pending", "searching", "offered", "accepted", "arrived", "in_progress", "in_trip"];

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("user_id", userId)
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
  const actorId = normalizeUuid(authedUserId ?? body?.user_id ?? body?.userId ?? body?.driver_id ?? body?.driverId);

  if (!orderId) {
    return { status: 400, payload: { ok: false, error: "order_id kerak" } };
  }

  const { data: existing, error: existingError } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .maybeSingle();

  if (existingError) {
    return { status: 500, payload: { ok: false, error: existingError.message } };
  }
  if (!existing) {
    return { status: 404, payload: { ok: false, error: "order_not_found" } };
  }

  if (actorId) {
    const ownerId = normalizeUuid(existing.user_id);
    const driverId = normalizeUuid(existing.driver_id);
    const canCancel = actorId === ownerId || actorId === driverId;
    if (!canCancel) {
      return { status: 403, payload: { ok: false, error: "forbidden" } };
    }
  }

  const cancellableStatuses = ["pending", "searching", "offered", "accepted", "arrived"];
  if (!cancellableStatuses.includes(String(existing.status || "").toLowerCase())) {
    return {
      status: 409,
      payload: {
        ok: false,
        error: "order_status_not_cancellable",
        status_value: existing.status ?? null,
      },
    };
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
    .eq("status", existing.status)
    .select(ORDER_SELECT)
    .single();

  if (error) {
    return { status: 500, payload: { ok: false, error: error.message } };
  }

  await supabase.from("order_status_history").insert({
    order_id: orderId,
    status: "cancelled",
    changed_by: actorId,
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

  const payloadUserId = payload.user_id ?? null;
  const canonicalUserId = normalizeUuid(authedUserId ?? payloadUserId);

  if (authedUserId && payloadUserId && canonicalUserId !== payloadUserId) {
    console.warn("order create user_id mismatch; auth token user_id ishlatiladi", {
      authedUserId,
      payloadUserId,
    });
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
    driver_id: payload.driver_id,
    service_type: payload.service_type,
    status: payload.status,
    pickup: payload.pickup,
    dropoff: payload.dropoff,
    payment_method: payload.payment_method,
    note: payload.note,
    price_uzs: payload.price_uzs,
    route_meta: payload.route_meta,
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
      const result = await handleGetById(supabase, body, req, authedUserId);
      return json(res, result.status, result.payload);
    }

    if (method !== "POST") {
      return json(res, 405, { ok: false, error: "method_not_allowed" });
    }

    if (action === "get") {
      const result = await handleGetById(supabase, body, req, authedUserId);
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
