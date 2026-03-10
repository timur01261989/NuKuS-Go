import crypto from 'crypto';

function roundCoord(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'x';
  return num.toFixed(5);
}

export function buildCreateOrderIdempotencyKey(payload = {}) {
  const pickup = payload.pickup || {};
  const dropoff = payload.dropoff || {};
  const raw = [
    payload.client_id || 'anon',
    payload.service_type || 'taxi',
    roundCoord(pickup.lat),
    roundCoord(pickup.lng),
    roundCoord(dropoff.lat),
    roundCoord(dropoff.lng),
    String(payload.payment_method || ''),
    String(payload.scheduled_time || ''),
  ].join('|');
  return crypto.createHash('sha1').update(raw).digest('hex');
}
