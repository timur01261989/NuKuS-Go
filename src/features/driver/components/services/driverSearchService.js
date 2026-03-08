import { supabase } from '@lib/supabase';

export async function searchDriversNearby({ center, radiusMeters, serviceType = null }) {
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
  return data
    .filter((d) => {
      if (d.lat == null || d.lng == null) return false;
      const dLat = (d.lat - lat) * 111;
      const dLng = (d.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
      return distKm <= radiusKm;
    })
    .map((d) => ({ id: d.driver_id, lat: d.lat, lng: d.lng }));
}
