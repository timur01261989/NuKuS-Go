import { supabase } from '@/services/supabase/supabaseClient.js';
import {
  fetchDriverCapabilitiesByUserIds,
  canDriverSeeOrder,
  getOrderTypeFromKey,
  getServiceAreaFromKey,
} from '@/modules/driver/legacy/core/driverCapabilityService.js';

export async function searchDriversNearby({
  center,
  radiusMeters,
  serviceType = null,
  serviceArea = null,
  orderType = null,
  weightKg = 0,
  volumeM3 = 0,
}) {
  const [lat, lng] = center || [];
  if (lat == null || lng == null) return [];

  const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();

  let query = supabase
    .from('driver_presence')
    .select('driver_id, lat, lng, active_service_type')
    .eq('is_online', true)
    .gte('last_seen_at', since)
    .limit(200);

  if (serviceType) query = query.eq('active_service_type', serviceType);

  const { data, error } = await query;
  if (error) {
    console.error('[driverSearchService] Supabase error:', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  const radiusKm = radiusMeters / 1000;
  let nearby = data
    .filter((d) => {
      if (d.lat == null || d.lng == null) return false;
      const dLat = (d.lat - lat) * 111;
      const dLng = (d.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
      return distKm <= radiusKm;
    })
    .map((d) => ({ id: d.driver_id, lat: d.lat, lng: d.lng, active_service_type: d.active_service_type }));

  const resolvedArea = serviceArea || getServiceAreaFromKey(serviceType);
  const resolvedType = orderType || getOrderTypeFromKey(serviceType || 'taxi');

  if (resolvedArea && resolvedType) {
    const capabilityMap = await fetchDriverCapabilitiesByUserIds(nearby.map((d) => d.id));
    nearby = nearby.filter((driver) => {
      const capability = capabilityMap.get(driver.id);
      return canDriverSeeOrder(capability, {
        serviceArea: resolvedArea,
        orderType: resolvedType,
        weightKg,
        volumeM3,
      });
    });
  }

  return nearby.map((d) => ({ id: d.id, lat: d.lat, lng: d.lng }));
}
