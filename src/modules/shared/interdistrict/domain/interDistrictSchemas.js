
import { INTERDISTRICT_TRIP_STATUS, INTERDISTRICT_TRIP_STATUS_DB, normalizeInterDistrictStatus, toDbInterDistrictStatus } from "./interDistrictStatuses";

export function normalizeInterDistrictTripPayload(input = {}) {
  const safeStatus = normalizeInterDistrictStatus(input.status || INTERDISTRICT_TRIP_STATUS.SEARCHING);
  return {
    region: input.region || input.region_id || "karakalpakstan",
    from_district: input.from_district || input.fromDistrict || null,
    to_district: input.to_district || input.toDistrict || null,
    tariff: input.tariff || "door",
    pitak_id: input.pitak_id || null,
    from_point: input.from_point || null,
    to_point: input.to_point || null,
    meeting_points: Array.isArray(input.meeting_points) ? input.meeting_points : [],
    route_polyline: Array.isArray(input.route_polyline) ? input.route_polyline : [],
    depart_at: input.depart_at || null,
    seats_total: Number(input.seats_total || 4),
    allow_full_salon: !!input.allow_full_salon,
    base_price_uzs: Number(input.base_price_uzs || 0),
    pickup_fee_uzs: Number(input.pickup_fee_uzs || 0),
    dropoff_fee_uzs: Number(input.dropoff_fee_uzs || 0),
    waiting_fee_uzs: Number(input.waiting_fee_uzs || 0),
    full_salon_price_uzs: input.full_salon_price_uzs == null ? null : Number(input.full_salon_price_uzs),
    has_ac: !!input.has_ac,
    has_trunk: !!input.has_trunk,
    is_lux: !!input.is_lux,
    has_delivery: !!(input.has_delivery || input.has_eltish),
    delivery_price_uzs: input.delivery_price_uzs == null ? (input.eltish_price_uzs == null ? null : Number(input.eltish_price_uzs)) : Number(input.delivery_price_uzs),
    has_freight: !!(input.has_freight || input.has_yuk),
    freight_price_uzs: input.freight_price_uzs == null ? (input.yuk_price_uzs == null ? null : Number(input.yuk_price_uzs)) : Number(input.freight_price_uzs),
    notes: input.notes || "",
    women_only: !!(input.women_only || input.female_only),
    booking_mode: input.booking_mode || "approval",
    status: toDbInterDistrictStatus(safeStatus),
    active_vehicle_id: input.active_vehicle_id || null,
    active_vehicle_max_weight_kg: input.active_vehicle_max_weight_kg == null ? null : Number(input.active_vehicle_max_weight_kg),
    active_vehicle_max_volume_m3: input.active_vehicle_max_volume_m3 == null ? null : Number(input.active_vehicle_max_volume_m3),
  };
}

export function normalizeInterDistrictRequestPayload(input = {}) {
  const safeStatus = normalizeInterDistrictStatus(input.status || INTERDISTRICT_TRIP_STATUS.SEARCHING);
  return {
    trip_id: input.trip_id,
    seats_requested: input.seats_requested == null ? null : Number(input.seats_requested),
    wants_full_salon: !!input.wants_full_salon,
    pickup_address: input.pickup_address || null,
    dropoff_address: input.dropoff_address || null,
    pickup_point: input.pickup_point || null,
    dropoff_point: input.dropoff_point || null,
    meeting_point_id: input.meeting_point_id || null,
    is_delivery: !!input.is_delivery,
    delivery_notes: input.delivery_notes || null,
    weight_category: input.weight_category || null,
    payment_method: input.payment_method || "cash",
    final_price: input.final_price == null ? null : Number(input.final_price),
    selected_seats: Array.isArray(input.selected_seats) ? input.selected_seats : [],
    status: toDbInterDistrictStatus(safeStatus),
    cancel_reason: input.cancel_reason || null,
  };
}
