import { supabase, assertSupabase } from '@/lib/supabase';

export function subscribeMessages(orderId, onChange) {
  assertSupabase();
  const sb = supabase;
  const channel = sb
    .channel(`msg:${orderId}`)
    .on('postgres_changes', { event:'*', schema:'public', table:'messages', filter:`order_id=eq.${orderId}` }, (payload) => onChange?.(payload))
    .subscribe();
  return () => sb.removeChannel(channel);
}
