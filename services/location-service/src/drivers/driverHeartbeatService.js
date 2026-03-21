import { nowIso } from '../orders/orderEvents.js';
import { getApprovedDriverCore } from './driverCoreAccess.js';

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function updateDriverHeartbeat(supabase, payload = {}) {
  const safeDriverId = String(payload.driver_id || payload.driverId || '').trim();
  if (!safeDriverId) throw new Error('driver_id_required');

  await getApprovedDriverCore(supabase, safeDriverId);

  const presencePayload = {
    driver_id: safeDriverId,
    is_online: true,
    state: 'online',
    active_service_type: payload.active_service_type || payload.service_type || payload.service || 'taxi',
    lat: toNumber(payload.lat),
    lng: toNumber(payload.lng),
    heading: toNumber(payload.bearing ?? payload.heading),
    speed: toNumber(payload.speed),
    last_seen_at: nowIso(),
    updated_at: nowIso(),
  };

  const { data, error } = await supabase
    .from('driver_presence')
    .upsert([presencePayload], { onConflict: 'driver_id' })
    .select('driver_id,is_online,active_service_type,lat,lng,last_seen_at')
    .maybeSingle();

  if (error) throw error;

  return {
    ok: true,
    driver: { user_id: safeDriverId },
    presence: data || null,
  };
}
