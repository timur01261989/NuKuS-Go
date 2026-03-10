export async function streamDriverLocation({ supabase, driverId, lat, lng }) {
  if (!supabase) throw new Error('supabase_required');
  if (!driverId) throw new Error('driver_id_required');
  if (lat == null || lng == null) throw new Error('coordinates_required');

  const payload = {
    driver_id: driverId,
    lat: Number(lat),
    lng: Number(lng),
    ts: new Date().toISOString(),
  };

  const { error } = await supabase.from('driver_location_stream').insert(payload);
  if (error) throw error;
  return payload;
}
