export function normalizeStatus(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : null;
}

export function allowedServicesFromSettings(settings = {}) {
  const out = new Set();
  if (settings.city_passenger) out.add('taxi');
  if (settings.city_delivery || settings.intercity_delivery || settings.interdistrict_delivery) out.add('delivery');
  if (settings.city_freight || settings.intercity_freight || settings.interdistrict_freight) out.add('freight');
  if (settings.interdistrict_passenger || settings.interdistrict_delivery || settings.interdistrict_freight) out.add('inter_district');
  if (settings.intercity_passenger || settings.intercity_delivery || settings.intercity_freight) out.add('inter_city');
  return [...out];
}

export async function getApprovedDriverCore(sb, userId) {
  const uid = String(userId || '').trim();
  if (!uid) throw new Error('driver_id_required');

  const [appRes, settingsRes, profileRes, vehicleRes] = await Promise.all([
    sb.from('driver_applications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('driver_service_settings').select('*').eq('user_id', uid).maybeSingle(),
    sb.from('profiles').select('id,active_vehicle_id,role').eq('id', uid).maybeSingle(),
    sb.from('vehicles').select('*').eq('user_id', uid).eq('is_active', true).limit(1).maybeSingle(),
  ]);
  if (appRes.error) throw appRes.error;
  if (settingsRes.error) throw settingsRes.error;
  if (profileRes.error) throw profileRes.error;
  if (vehicleRes.error && !String(vehicleRes.error.message || '').toLowerCase().includes('no rows')) throw vehicleRes.error;

  const app = appRes.data || null;
  if (!app || normalizeStatus(app.status) !== 'approved') throw new Error('Tasdiqlangan driver kerak');

  return {
    user_id: uid,
    application: app,
    profile: profileRes.data || null,
    service_settings: settingsRes.data || null,
    active_vehicle: vehicleRes.data || null,
    allowed_services: allowedServicesFromSettings(settingsRes.data || {}),
    is_verified: true,
    approved: true,
    is_active: true,
  };
}
