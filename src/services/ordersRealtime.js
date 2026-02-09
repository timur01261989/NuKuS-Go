import { assertSupabase } from './supabaseClient.js';

export function subscribeOrder(orderId, onChange) {
  const sb = assertSupabase();
  const channel = sb
    .channel(`order:${orderId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => onChange?.(payload)
    )
    .subscribe();

  return () => sb.removeChannel(channel);
}

export function subscribeDriverLocation(orderId, onChange) {
  const sb = assertSupabase();
  const channel = sb
    .channel(`driverloc:${orderId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'driver_locations', filter: `order_id=eq.${orderId}` },
      (payload) => onChange?.(payload)
    )
    .subscribe();

  return () => sb.removeChannel(channel);
}
