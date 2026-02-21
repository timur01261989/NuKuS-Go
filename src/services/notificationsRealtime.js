import { assertSupabase } from './supabaseClient.js';

export function subscribeNotifications(userId, onChange) {
  const sb = assertSupabase();
  const channel = sb
    .channel(`notif:${userId}`)
    .on('postgres_changes', { event:'*', schema:'public', table:'notifications', filter:`user_id=eq.${userId}` }, (payload) => onChange?.(payload))
    .subscribe();
  return () => sb.removeChannel(channel);
}
