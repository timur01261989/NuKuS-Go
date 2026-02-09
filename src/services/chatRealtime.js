import { assertSupabase } from './supabaseClient.js';

export function subscribeMessages(orderId, onChange) {
  const sb = assertSupabase();
  const channel = sb
    .channel(`msg:${orderId}`)
    .on('postgres_changes', { event:'*', schema:'public', table:'messages', filter:`order_id=eq.${orderId}` }, (payload) => onChange?.(payload))
    .subscribe();
  return () => sb.removeChannel(channel);
}
