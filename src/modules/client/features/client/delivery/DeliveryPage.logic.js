
import { calcDeliveryCommission, getStandardPointLabel } from "./services/deliveryPure.js";

export const DELIVERY_FORM_INITIAL = {
  serviceMode: "city",
  pickupMode: "precise",
  dropoffMode: "precise",
  parcelType: "document",
  weightKg: 0,
  comment: "",
  senderPhone: "",
  receiverName: "",
  receiverPhone: "",
  pickup: { region: null, district: "", point: null, label: "" },
  dropoff: { region: null, district: "", point: null, label: "" },
};

export function findMatchedTrip(availableTrips, serviceMode, pickupRegion, dropoffRegion) {
  if (serviceMode !== "region") return null;
  return (
    availableTrips.find(
      (trip) =>
        trip.from_region === pickupRegion &&
        trip.to_region === dropoffRegion &&
        Boolean(trip.is_delivery)
    ) || null
  );
}

export function getDeliveryPointLabel(mode, pointState, cp) {
  if (mode === "precise") {
    return pointState.label || cp("Xaritadan aniq manzil");
  }
  return getStandardPointLabel(pointState.region, pointState.district);
}

export function canSubmitDeliveryForm({
  senderPhone,
  receiverPhone,
  receiverName,
  pickup,
  dropoff,
  serviceMode,
  pickupMode,
  dropoffMode,
  needsWeight,
  weightKg,
  maxKg,
}) {
  if (senderPhone.length !== 9 || receiverPhone.length !== 9 || !receiverName.trim()) return false;
  if (!pickup.region || !dropoff.region) return false;
  if (serviceMode !== "city" && (!pickup.district || !dropoff.district)) return false;
  if (pickupMode === "precise" && !pickup.point) return false;
  if (dropoffMode === "precise" && !dropoff.point) return false;
  if (needsWeight && (!weightKg || weightKg <= 0 || weightKg > maxKg)) return false;
  return true;
}

export function createDeliveryPayload({
  userId,
  serviceMode,
  parcelType,
  parcelMeta,
  weightKg,
  price,
  comment,
  receiverName,
  receiverPhone,
  senderPhone,
  pickupMode,
  dropoffMode,
  pickup,
  dropoff,
  pickupLabel,
  dropoffLabel,
  matchedTrip,
}) {
  return {
    created_by: userId || null,
    service_mode: serviceMode,
    parcel_type: parcelType,
    parcel_label: parcelMeta.label,
    weight_kg: Number(weightKg || 0),
    price,
    commission_amount: calcDeliveryCommission(price),
    payment_method: "cash",
    comment,
    receiver_name: receiverName.trim(),
    receiver_phone: receiverPhone,
    sender_phone: senderPhone,
    pickup_mode: pickupMode,
    dropoff_mode: dropoffMode,
    pickup_region: pickup.region || "",
    pickup_district: pickup.district || "",
    pickup_label: pickupLabel,
    pickup_lat: pickup.point?.[0] ?? null,
    pickup_lng: pickup.point?.[1] ?? null,
    dropoff_region: dropoff.region || "",
    dropoff_district: dropoff.district || "",
    dropoff_label: dropoffLabel,
    dropoff_lat: dropoff.point?.[0] ?? null,
    dropoff_lng: dropoff.point?.[1] ?? null,
    matched_trip_id: matchedTrip?.id || null,
    matched_trip_title: matchedTrip
      ? `${matchedTrip.from_region}${matchedTrip.from_district ? ` • ${matchedTrip.from_district}` : ""} → ${matchedTrip.to_region}${matchedTrip.to_district ? ` • ${matchedTrip.to_district}` : ""}`
      : "",
  };
}

export function applyDeliveryOrderToForm(order, setState, clampUzPhoneDigits) {
  setState("editingId", order.id);
  setState("serviceMode", order.service_mode || "city");
  setState("pickupMode", order.pickup_mode || "precise");
  setState("dropoffMode", order.dropoff_mode || "precise");
  setState("parcelType", order.parcel_type || "document");
  setState("weightKg", Number(order.weight_kg || 0));
  setState("comment", order.comment || "");
  setState("senderPhone", clampUzPhoneDigits(order.sender_phone || ""));
  setState("receiverName", order.receiver_name || "");
  setState("receiverPhone", clampUzPhoneDigits(order.receiver_phone || ""));
  setState("pickup", {
    region: order.pickup_region || null,
    district: order.pickup_district || "",
    point:
      order.pickup_lat != null && order.pickup_lng != null
        ? [Number(order.pickup_lat), Number(order.pickup_lng)]
        : null,
    label: order.pickup_label || "",
  });
  setState("dropoff", {
    region: order.dropoff_region || null,
    district: order.dropoff_district || "",
    point:
      order.dropoff_lat != null && order.dropoff_lng != null
        ? [Number(order.dropoff_lat), Number(order.dropoff_lng)]
        : null,
    label: order.dropoff_label || "",
  });
}
