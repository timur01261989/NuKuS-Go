export async function triggerSOS({ supabase, userId, orderId = null, lat = null, lng = null, message = '' }) {
  if (!supabase) throw new Error('supabase_required');
  if (!userId) throw new Error('user_id_required');

  const payload = {
    user_id: userId,
    order_id: orderId,
    lat: lat == null ? null : Number(lat),
    lng: lng == null ? null : Number(lng),
    message: String(message || '').trim() || null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('sos_alerts').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}
