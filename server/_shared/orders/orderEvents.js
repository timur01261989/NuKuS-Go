export async function logOrderEvent(sb, payload = {}) {
  try {
    await sb.from('order_events').insert([
      {
        order_id: payload.order_id,
        actor_user_id: payload.actor_user_id || null,
        actor_role: payload.actor_role || 'system',
        event_code: payload.event_code,
        reason: payload.reason || null,
        from_status: payload.from_status || null,
        to_status: payload.to_status || null,
        payload: payload.payload || {},
      },
    ]);
  } catch (_) {
    // swallow logging failures
  }
}
