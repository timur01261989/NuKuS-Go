function toText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function toNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeLocationLike(input) {
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

  if (lat == null || lng == null) return null;

  return {
    address,
    lat,
    lng,
  };
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function toPickupLocation(value) {
  return normalizeLocationLike(value);
}

export function toDropoffLocation(value) {
  return normalizeLocationLike(value);
}

export function toCreateOrderPayload(draft = {}) {
  const pickup = toPickupLocation(
    draft.pickup ?? draft.from ?? draft.from_location ?? draft.pickup_location
  );

  const dropoff = toDropoffLocation(
    draft.dropoff ?? draft.to ?? draft.to_location ?? draft.dropoff_location
  );

  const options = normalizeObject(draft.options);
  const meta = normalizeObject(draft.meta);

  const routeMeta = {
    ...meta,
    options,
    pricing: {
      surge_multiplier: draft.surge_multiplier ?? draft.surgeMultiplier ?? 1,
      distance_m: draft.distance_m ?? draft.distanceM ?? draft.distance ?? null,
      duration_s: draft.duration_s ?? draft.durationS ?? draft.duration ?? null,
      car_type: draft.car_type ?? draft.carType ?? draft.tariff ?? draft.tarif ?? null,
    },
  };

  return {
    user_id: draft.user_id ?? draft.userId ?? draft.client_id ?? null,
    client_id: draft.user_id ?? draft.userId ?? draft.client_id ?? null,
    service_type: draft.service_type ?? draft.serviceType ?? "taxi",
    payment_method: draft.payment_method ?? draft.paymentMethod ?? "cash",
    note: draft.comment ?? draft.note ?? draft.notes ?? null,
    comment: draft.comment ?? draft.note ?? draft.notes ?? null,
    price_uzs: draft.price_uzs ?? draft.priceUzs ?? draft.price ?? null,
    passenger_count: draft.passenger_count ?? draft.passengerCount ?? options.passengerCount ?? 1,
    cargo_title: draft.cargo_title ?? draft.cargoTitle ?? options.cargoTitle ?? null,
    cargo_weight_kg: draft.cargo_weight_kg ?? draft.cargoWeightKg ?? options.cargoWeightKg ?? options.weightKg ?? null,
    cargo_volume_m3: draft.cargo_volume_m3 ?? draft.cargoVolumeM3 ?? options.cargoVolumeM3 ?? options.volumeM3 ?? null,
    route_meta: routeMeta,
    options,
    pickup,
    dropoff: dropoff || null,

    // Legacy compatibility fields. Kept on purpose so old backend/client code does not break.
    pickup_location: pickup
      ? {
          address: pickup.address,
          lat: pickup.lat,
          lng: pickup.lng,
        }
      : null,
    dropoff_location: dropoff
      ? {
          address: dropoff.address,
          lat: dropoff.lat,
          lng: dropoff.lng,
        }
      : null,
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
  };
}

export function fromOrderResponse(order = null) {
  if (!order || typeof order !== "object") return null;

  const pickup = toPickupLocation(order.pickup ?? order.pickup_location ?? order.from_location);
  const dropoff = toDropoffLocation(order.dropoff ?? order.dropoff_location ?? order.to_location);
  const routeMeta = normalizeObject(order.route_meta ?? order.meta);
  const pricing = normalizeObject(routeMeta.pricing);

  return {
    id: order.id ?? order.order_id ?? order.orderId ?? null,
    user_id: order.user_id ?? order.client_id ?? null,
    client_id: order.client_id ?? order.user_id ?? null,
    driver_id: order.driver_id ?? null,
    status: order.status ?? null,
    service_type: order.service_type ?? "taxi",
    pickup,
    dropoff: dropoff || null,
    payment_method: order.payment_method ?? null,
    car_type: order.car_type ?? pricing.car_type ?? null,
    comment: order.comment ?? order.note ?? null,
    note: order.note ?? order.comment ?? null,
    price_uzs: order.price_uzs ?? null,
    surge_multiplier: order.surge_multiplier ?? pricing.surge_multiplier ?? 1,
    distance_m: order.distance_m ?? pricing.distance_m ?? null,
    duration_s: order.duration_s ?? pricing.duration_s ?? null,
    route_meta: routeMeta,
    options: order.options && typeof order.options === "object" ? order.options : normalizeObject(routeMeta.options),
    passenger_count: order.passenger_count ?? null,
    cargo_title: order.cargo_title ?? null,
    cargo_weight_kg: order.cargo_weight_kg ?? null,
    cargo_volume_m3: order.cargo_volume_m3 ?? null,
    created_at: order.created_at ?? null,
    updated_at: order.updated_at ?? null,
  };
}
