function isValidCoordinate(value, min, max) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

export function validateLocation(location, { required = false, label = 'location' } = {}) {
  if (!location) {
    if (required) return `${label} kerak`;
    return null;
  }
  if (location.lat == null && location.lng == null) return null;
  if (!isValidCoordinate(location.lat, -90, 90) || !isValidCoordinate(location.lng, -180, 180)) {
    return `${label} koordinatalari noto'g'ri`;
  }
  return null;
}

export function validateCreateOrderPayload(payload = {}) {
  const pickupError = validateLocation(payload.pickup, { required: true, label: 'pickup' });
  if (pickupError) return pickupError;
  const dropoffError = validateLocation(payload.dropoff, { required: false, label: 'dropoff' });
  if (dropoffError) return dropoffError;
  if (payload.service_type === 'freight' && !(Number(payload.cargo_weight_kg) > 0)) {
    return 'Freight uchun cargo_weight_kg kerak';
  }
  return null;
}

export function assertOrderId(orderId) {
  const value = String(orderId || '').trim();
  return value || null;
}
