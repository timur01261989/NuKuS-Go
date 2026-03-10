export const ORDER_ACTIVE_STATUSES = Object.freeze([
  'draft',
  'pending',
  'created',
  'searching',
  'offered',
  'accepted',
  'arrived',
  'in_progress',
  'in_trip',
]);

function cleanText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeLocation(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    const address = cleanText(input);
    return address ? { address, lat: null, lng: null } : null;
  }
  if (typeof input !== 'object') return null;

  const lat = toFiniteNumber(
    input.lat ?? input.latitude ?? input.location?.lat ?? input.raw?.lat ?? input.raw?.latitude,
  );
  const lng = toFiniteNumber(
    input.lng ?? input.lon ?? input.longitude ?? input.location?.lng ?? input.raw?.lng ?? input.raw?.lon ?? input.raw?.longitude,
  );
  const address = cleanText(
    input.address ?? input.label ?? input.name ?? input.title ?? input.display_name ?? input.formatted_address ?? input.raw?.display_name,
  );
  const region = cleanText(input.region ?? input.address_details?.state ?? input.raw?.address?.state);
  const district = cleanText(input.district ?? input.address_details?.county ?? input.raw?.address?.county);

  if (!address && lat == null && lng == null) return null;

  return {
    address,
    lat,
    lng,
    region,
    district,
    raw: input.raw ?? input,
  };
}

export function normalizePickup(body = {}) {
  return normalizeLocation(
    body.pickup ??
      body.from_location ??
      body.from ??
      body.fromLocation ??
      body.from_address ??
      body.pickup_location ??
      (body.from_lat != null || body.from_lng != null
        ? {
            address: body.pickup_location ?? body.from_address ?? body.from_location,
            lat: body.from_lat,
            lng: body.from_lng,
          }
        : null),
  );
}

export function normalizeDropoff(body = {}) {
  return normalizeLocation(
    body.dropoff ??
      body.to_location ??
      body.to ??
      body.toLocation ??
      body.to_address ??
      body.dropoff_location ??
      (body.to_lat != null || body.to_lng != null
        ? {
            address: body.dropoff_location ?? body.to_address ?? body.to_location,
            lat: body.to_lat,
            lng: body.to_lng,
          }
        : null),
  );
}

export function buildUnifiedOrderPayload(body = {}, clientId = null) {
  const pickup = normalizePickup(body);
  const dropoff = normalizeDropoff(body);
  const serviceType = String(body.service_type ?? body.serviceType ?? body.service ?? 'taxi').trim().toLowerCase() || 'taxi';

  return {
    client_id: clientId,
    service_type: serviceType,
    pickup,
    dropoff,
    status: String(body.status ?? body.order_status ?? 'searching').trim().toLowerCase() || 'searching',
    price_uzs: Math.max(0, Number(body.price_uzs ?? body.price ?? body.fare ?? body.amount ?? 0) || 0),
    route_meta: {
      distance_km: Math.max(0, Number(body.distance_km ?? body.distanceKm ?? body.distance ?? 0) || 0),
      duration_min: Math.max(0, Number(body.duration_min ?? body.durationMin ?? body.duration ?? 0) || 0),
      tariff_id: cleanText(body.tariff_id ?? body.tariffId),
      polyline: Array.isArray(body.polyline) ? body.polyline : [],
      waypoints: Array.isArray(body.waypoints)
        ? body.waypoints.map((item) => normalizeLocation(item)).filter(Boolean)
        : [],
      pickup_entrance: cleanText(body.pickup_entrance ?? body.entrance ?? body.pickupEntrance),
      order_for: cleanText(body.order_for),
      other_phone: cleanText(body.other_phone),
      wishes: body.wishes && typeof body.wishes === 'object' ? body.wishes : {},
      scheduled_time: body.scheduled_time ?? body.scheduledTime ?? null,
    },
    cargo_title: cleanText(body.cargo_title ?? body.cargo_name),
    cargo_weight_kg: body.cargo_weight_kg == null ? null : toFiniteNumber(body.cargo_weight_kg ?? body.weight_kg),
    cargo_volume_m3: body.cargo_volume_m3 == null ? null : toFiniteNumber(body.cargo_volume_m3 ?? body.volume_m3),
    passenger_count: Math.max(1, Number(body.passenger_count ?? body.seat_count ?? body.passengers ?? 1) || 1),
    payment_method: String(body.payment_method ?? body.pay_method ?? 'cash').trim().toLowerCase() || 'cash',
    note: cleanText(body.note ?? body.comment),
  };
}

export function isTerminalStatus(status) {
  return ['completed', 'cancelled', 'cancelled_by_client', 'cancelled_by_driver', 'expired'].includes(String(status || '').toLowerCase());
}
