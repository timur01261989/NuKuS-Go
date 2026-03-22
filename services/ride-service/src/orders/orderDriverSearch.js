function toFinite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

export async function findDriversInRadius({ supabase, lat, lng, radiusMeters = 2000, serviceType = 'taxi', limit = 50 }) {
  const safeLat = toFinite(lat);
  const safeLng = toFinite(lng);
  const safeRadius = Math.max(200, toFinite(radiusMeters, 2000));
  const safeLimit = Math.max(1, Math.min(200, toFinite(limit, 50)));
  if (safeLat == null || safeLng == null) return [];

  try {
    const { data, error } = await supabase.rpc('drivers_in_radius', { lat: safeLat, lng: safeLng, radius: safeRadius });
    if (error) throw error;
    const rpcRows = (Array.isArray(data) ? data : []).slice(0, safeLimit);
    // RPC: user_id, last_seen, dist_m — dispatch uchun eski maydon nomlari bilan moslashtiramiz
    return rpcRows.map((row) => {
      const distM = Number(row.dist_m);
      return {
        driver_id: row.user_id,
        id: row.user_id,
        is_online: true,
        last_seen_at: row.last_seen,
        updated_at: row.last_seen,
        dist_km: Number.isFinite(distM) ? distM / 1000 : null,
      };
    });
  } catch (_) {
    const { data, error } = await supabase
      .from('driver_presence')
      .select('driver_id,is_online,active_service_type,lat,lng,updated_at,last_seen_at')
      .eq('is_online', true)
      .limit(200);
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    return rows
      .filter((row) => !serviceType || !row.active_service_type || row.active_service_type === serviceType)
      .map((row) => {
        const dist_km = haversineKm(safeLat, safeLng, toFinite(row.lat, safeLat), toFinite(row.lng, safeLng));
        return { ...row, id: row.driver_id, driver_id: row.driver_id, dist_km };
      })
      .filter((row) => Number.isFinite(row.dist_km) && row.dist_km * 1000 <= safeRadius)
      .sort((a, b) => a.dist_km - b.dist_km)
      .slice(0, safeLimit);
  }
}
