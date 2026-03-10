import { nowIso } from '../orders/orderEvents.js';

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function updateDriverHeartbeat({ supabase, driverId, lat, lng, heading = null, speed = null, serviceType = null }) {
  const safeDriverId = String(driverId || '').trim();
  const safeLat = toNumber(lat);
  const safeLng = toNumber(lng);
  if (!safeDriverId) throw new Error('driverId_required');
  if (safeLat == null || safeLng == null) throw new Error('coordinates_required');

  const pointWkt = `POINT(${safeLng} ${safeLat})`;
  const payload = {
    user_id: safeDriverId,
    last_seen: nowIso(),
    updated_at: nowIso(),
    active_service_type: serviceType || 'taxi',
    location: pointWkt,
    lat: safeLat,
    lng: safeLng,
    bearing: toNumber(heading),
    speed: toNumber(speed),
  };

  const driverRes = await supabase.from('drivers').update({
    location: pointWkt,
    last_seen: payload.last_seen,
    updated_at: payload.updated_at,
  }).eq('user_id', safeDriverId).select('user_id').maybeSingle();
  if (driverRes.error) throw driverRes.error;

  const presenceRes = await supabase.from('driver_presence').upsert([{
    driver_id: safeDriverId,
    is_online: true,
    state: 'online',
    active_service_type: payload.active_service_type,
    lat: safeLat,
    lng: safeLng,
    bearing: payload.bearing,
    speed: payload.speed,
    last_seen_at: payload.last_seen,
    updated_at: payload.updated_at,
  }], { onConflict: 'driver_id' }).select('driver_id,is_online,active_service_type,lat,lng,last_seen_at').maybeSingle();
  if (presenceRes.error) throw presenceRes.error;

  return { ok: true, driver: driverRes.data || { user_id: safeDriverId }, presence: presenceRes.data || null };
}
