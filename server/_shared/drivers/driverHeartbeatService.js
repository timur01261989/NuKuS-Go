import { nowIso } from '../orders/orderEvents.js';

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}


async function ensureDriverRow(supabase, safeDriverId) {
  let { data: driver, error } = await supabase.from('drivers').select('user_id').eq('user_id', safeDriverId).maybeSingle();
  if (error) throw error;
  if (driver) return driver;

  const { data: app, error: appError } = await supabase
    .from('driver_applications')
    .select('id,user_id,status,transport_type,seat_count,requested_max_freight_weight_kg,requested_payload_volume_m3,vehicle_brand,vehicle_model,vehicle_year,vehicle_plate,vehicle_color')
    .eq('user_id', safeDriverId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (appError) throw appError;
  if (!app || app.status !== 'approved') throw new Error('Driver row topilmadi. Avval tasdiqlangan driver bo\'lish kerak.');

  const rpcResult = await supabase.rpc('apply_driver_permissions', { p_user_id: safeDriverId }).catch(() => ({ error: null }));
  if (rpcResult?.error) {
    const allowed = app.transport_type === 'truck' ? ['freight'] : (app.transport_type === 'bus_gazel' ? ['delivery','inter_district','inter_city','freight'] : ['taxi','delivery','inter_district','inter_city','freight']);
    const insertPayload = {
      user_id: safeDriverId,
      application_id: app.id,
      transport_type: app.transport_type || 'light_car',
      allowed_services: allowed,
      seat_count: Number(app.seat_count || 0),
      max_freight_weight_kg: Number(app.requested_max_freight_weight_kg || 0),
      payload_volume_m3: Number(app.requested_payload_volume_m3 || 0),
      vehicle_brand: app.vehicle_brand || null,
      vehicle_model: app.vehicle_model || null,
      vehicle_year: app.vehicle_year || null,
      vehicle_plate: app.vehicle_plate || null,
      vehicle_color: app.vehicle_color || null,
      is_verified: true,
      is_active: true,
      is_suspended: false,
      approved_at: nowIso(),
      updated_at: nowIso(),
    };
    const { error: insertError } = await supabase.from('drivers').upsert([insertPayload], { onConflict: 'user_id' });
    if (insertError) throw insertError;
  }

  ({ data: driver, error } = await supabase.from('drivers').select('user_id').eq('user_id', safeDriverId).maybeSingle());
  if (error) throw error;
  if (!driver) throw new Error('Driver row yaratilmadi');
  return driver;
}
export async function updateDriverHeartbeat({ supabase, driverId, lat, lng, heading = null, speed = null, serviceType = null }) {
  const safeDriverId = String(driverId || '').trim();
  const safeLat = toNumber(lat);
  const safeLng = toNumber(lng);
  if (!safeDriverId) throw new Error('driverId_required');
  if (safeLat == null || safeLng == null) throw new Error('coordinates_required');

  await ensureDriverRow(supabase, safeDriverId);

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

  let driverRes = await supabase.from('drivers').update({
    updated_at: payload.updated_at,
    approved_at: payload.updated_at,
  }).eq('user_id', safeDriverId).select('user_id').maybeSingle();
  if (driverRes.error && !String(driverRes.error.message || '').match(/approved_at/i)) throw driverRes.error;
  if (driverRes.error) {
    driverRes = await supabase.from('drivers').update({ updated_at: payload.updated_at }).eq('user_id', safeDriverId).select('user_id').maybeSingle();
    if (driverRes.error) throw driverRes.error;
  }

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
