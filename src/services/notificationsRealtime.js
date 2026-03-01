import { supabase, assertSupabase } from '@/lib/supabase';

export function subscribeNotifications(userId, onChange) {
  assertSupabase();
  const sb = supabase;
  const channel = sb
    .channel(`notif:${userId}`)
    .on('postgres_changes', { event:'*', schema:'public', table:'notifications', filter:`user_id=eq.${userId}` }, (payload) => onChange?.(payload))
    .subscribe();
  return () => sb.removeChannel(channel);
}
