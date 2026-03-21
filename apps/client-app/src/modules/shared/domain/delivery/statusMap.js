
export const DELIVERY_CANONICAL_STATUSES = Object.freeze({
  DRAFT: "draft",
  SEARCHING: "searching",
  ACCEPTED: "accepted",
  PICKED_UP: "picked_up",
  DELIVERED: "delivered",
  CANCELED: "canceled",
});

const STATUS_ALIASES = new Map([
  ["draft", DELIVERY_CANONICAL_STATUSES.DRAFT],
  ["new", DELIVERY_CANONICAL_STATUSES.DRAFT],
  ["pending", DELIVERY_CANONICAL_STATUSES.SEARCHING],
  ["searching", DELIVERY_CANONICAL_STATUSES.SEARCHING],
  ["queued", DELIVERY_CANONICAL_STATUSES.SEARCHING],
  ["accepted", DELIVERY_CANONICAL_STATUSES.ACCEPTED],
  ["assigned", DELIVERY_CANONICAL_STATUSES.ACCEPTED],
  ["accepted_by_driver", DELIVERY_CANONICAL_STATUSES.ACCEPTED],
  ["pickup", DELIVERY_CANONICAL_STATUSES.PICKED_UP],
  ["picked_up", DELIVERY_CANONICAL_STATUSES.PICKED_UP],
  ["in_delivery", DELIVERY_CANONICAL_STATUSES.PICKED_UP],
  ["delivered", DELIVERY_CANONICAL_STATUSES.DELIVERED],
  ["completed", DELIVERY_CANONICAL_STATUSES.DELIVERED],
  ["done", DELIVERY_CANONICAL_STATUSES.DELIVERED],
  ["cancelled", DELIVERY_CANONICAL_STATUSES.CANCELED],
  ["canceled", DELIVERY_CANONICAL_STATUSES.CANCELED],
  ["rejected", DELIVERY_CANONICAL_STATUSES.CANCELED],
]);

export function normalizeDeliveryStatus(value) {
  const key = String(value || "").trim().toLowerCase();
  return STATUS_ALIASES.get(key) || DELIVERY_CANONICAL_STATUSES.SEARCHING;
}

export function toDeliveryDriverAction(status) {
  const current = normalizeDeliveryStatus(status);
  if (current === DELIVERY_CANONICAL_STATUSES.SEARCHING) return DELIVERY_CANONICAL_STATUSES.ACCEPTED;
  if (current === DELIVERY_CANONICAL_STATUSES.ACCEPTED) return DELIVERY_CANONICAL_STATUSES.PICKED_UP;
  if (current === DELIVERY_CANONICAL_STATUSES.PICKED_UP) return DELIVERY_CANONICAL_STATUSES.DELIVERED;
  return current;
}

export function isDeliveryTerminalStatus(status) {
  const current = normalizeDeliveryStatus(status);
  return current === DELIVERY_CANONICAL_STATUSES.DELIVERED || current === DELIVERY_CANONICAL_STATUSES.CANCELED;
}

export function normalizeDeliveryOrder(row = {}) {
  const pickupLocation = row.pickup_location || {
    lat: row.pickup_lat ?? null,
    lng: row.pickup_lng ?? null,
    address: row.pickup_label || "",
    city: row.pickup_region || "",
  };
  const dropLocation = row.drop_location || {
    lat: row.dropoff_lat ?? null,
    lng: row.dropoff_lng ?? null,
    address: row.dropoff_label || "",
    city: row.dropoff_region || "",
  };
  return {
    ...row,
    status: normalizeDeliveryStatus(row.status),
    title: row.title || row.parcel_label || row.parcel_type || "Yetkazma",
    amount: Number(row.amount ?? row.price ?? row.price_uzs ?? 0),
    price: Number(row.price ?? row.price_uzs ?? row.amount ?? 0),
    pickup_location: pickupLocation,
    drop_location: dropLocation,
    receiver_phone: row.receiver_phone || row.receiver?.phone || "",
    receiver_name: row.receiver_name || row.receiver?.name || "",
    sender_phone: row.sender_phone || row.sender?.phone || "",
    serviceArea: row.service_area || row.serviceArea || row.service_mode || "city",
    orderType: row.order_type || row.orderType || "delivery",
    order_id: row.order_id || row.id || null,
    parcel_id: row.parcel_id || row.id || null,
  };
}
