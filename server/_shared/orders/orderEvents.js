export function nowIso() {
  return new Date().toISOString();
}

export async function emitOrderEvent(supabase, {
  order_id,
  event_code,
  actor_user_id = null,
  actor_role = 'system',
  reason = null,
  from_status = null,
  to_status = null,
  payload = {},
}) {
  if (!order_id || !event_code) return { ok: false, skipped: true };
  const row = {
    order_id: String(order_id),
    event_code: String(event_code),
    actor_user_id,
    actor_role,
    reason,
    from_status,
    to_status,
    payload: payload && typeof payload === 'object' ? payload : {},
    created_at: nowIso(),
  };
  const { data, error } = await supabase
    .from('order_events')
    .insert([row])
    .select('id,order_id,event_code,actor_role,from_status,to_status,payload,created_at')
    .single();
  if (error) throw error;
  return { ok: true, event: data || row };
}

export async function listOrderEvents(supabase, orderId, limit = 50) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const { data, error } = await supabase
    .from('order_events')
    .select('id,order_id,event_code,actor_role,actor_user_id,reason,from_status,to_status,payload,created_at')
    .eq('order_id', String(orderId || ''))
    .order('created_at', { ascending: true })
    .limit(safeLimit);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
