export const ORDER_SELECT = [
  "id",
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
].join(",");

export function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function getMethod(req) {
  return String(req.method || "GET").toUpperCase();
}

export function getQueryValue(req, key) {
  try {
    const url = new URL(req.url || "", "http://localhost");
    const value = url.searchParams.get(key);
    return value == null ? "" : String(value);
  } catch {
    return "";
  }
}

export function toText(value) {
  if (value == null) return "";
  return String(value).trim();
}

export function toNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toInteger(value) {
  const n = toNumber(value);
  if (n == null) return null;
  return Number.isInteger(n) ? n : Math.round(n);
}

export function normalizeUuid(value) {
  const text = toText(value);
  return text || null;
}

function isValidLatitude(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

export function normalizeLocationObject(input) {
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

export function normalizePickup(body) {
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

export function normalizeDropoff(body) {
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

export function normalizeJsonObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function buildNormalizedPayload(body) {
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

  const normalizedUserId = normalizeUuid(body?.user_id ?? body?.userId);
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

export function buildResponseOrder(row) {
  if (!row) return null;

  const routeMeta = normalizeJsonObject(row.route_meta);
  const pricing = normalizeJsonObject(routeMeta.pricing);
  const options = normalizeJsonObject(routeMeta.options);

  const pickup = row.pickup ?? null;
  const dropoff = row.dropoff ?? null;

  // Legacy/compat fields used by taxi client code.
  // (Some clients read `from_lat/from_lng`, others read `pickup.lat/lng`.)
  const pickupLocation =
    pickup && typeof pickup === "object"
      ? { address: pickup.address ?? null, lat: pickup.lat ?? null, lng: pickup.lng ?? null }
      : null;
  const dropoffLocation =
    dropoff && typeof dropoff === "object"
      ? { address: dropoff.address ?? null, lat: dropoff.lat ?? null, lng: dropoff.lng ?? null }
      : null;

  return {
    id: row.id,
    user_id: row.user_id ?? null,
    driver_id: row.driver_id ?? null,
    service_type: row.service_type ?? "taxi",
    status: row.status ?? null,
    pickup,
    dropoff,

    // Taxi compat fields
    pickup_location: pickupLocation,
    dropoff_location: dropoffLocation,
    pickup_address: pickup?.address ?? null,
    dropoff_address: dropoff?.address ?? null,
    pickup_lat: pickup?.lat ?? null,
    pickup_lng: pickup?.lng ?? null,
    dropoff_lat: dropoff?.lat ?? null,
    dropoff_lng: dropoff?.lng ?? null,
    from_address: pickup?.address ?? null,
    to_address: dropoff?.address ?? null,
    from_lat: pickup?.lat ?? null,
    from_lng: pickup?.lng ?? null,
    to_lat: dropoff?.lat ?? null,
    to_lng: dropoff?.lng ?? null,

    payment_method: row.payment_method ?? null,
    car_type: pricing.car_type ?? null,
    comment: row.note ?? null,
    note: row.note ?? null,
    price_uzs: row.price_uzs ?? null,
    surge_multiplier: pricing.surge_multiplier ?? 1,
    distance_m: pricing.distance_m ?? null,
    duration_s: pricing.duration_s ?? null,
    options,
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

export async function readBody(req) {
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
