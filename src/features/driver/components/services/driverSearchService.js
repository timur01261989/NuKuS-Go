import { supabase } from '@lib/supabase';

/**
 * searchDriversNearby
 * Supabase driver_presence jadvalidan haqiqiy online haydovchilarni qidiradi.
 *
 * @param {Object} params
 * @param {[number, number]} params.center - [lat, lng]
 * @param {number} params.radiusMeters - radius in meters
 * @returns {Promise<Array<{id: string, lat: number, lng: number}>>}
 */
export async function searchDriversNearby({ center, radiusMeters }) {
  const [lat, lng] = center || [];
  if (lat == null || lng == null) return [];

  // So'nggi 2 daqiqada yangilangan online haydovchilar
  const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('drivers')
    .select('user_id, lat, lng')
    .eq('is_online', true)
    .gte('updated_at', since)
    .limit(200);

  if (error) {
    console.error('[driverSearchService] Supabase error:', error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Haversine formula bilan radius ichidagilarni filter qilish
  const radiusKm = radiusMeters / 1000;

  return data
    .filter(d => {
      if (d.lat == null || d.lng == null) return false;
      const dLat = (d.lat - lat) * 111;
      const dLng = (d.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
      return distKm <= radiusKm;
    })
    .map(d => ({
      id: d.user_id,
      lat: d.lat,
      lng: d.lng,
    }));
}
