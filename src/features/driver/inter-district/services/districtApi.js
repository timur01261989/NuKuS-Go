import { supabase } from '@/lib/supabase';

// Jadval nomlari (loyihangizga moslab)
const TBL_QUEUE = 'queues';
const TBL_REQUESTS = 'district_requests';
const TBL_LOCATIONS = 'locations';

export async function upsertDriverLocation({ driver_id, lat, lng, mode }) {
  if (!supabase) throw new Error('Supabase client topilmadi');
  const payload = { driver_id, lat, lng, mode, updated_at: new Date().toISOString() };
  return supabase.from(TBL_LOCATIONS).upsert(payload, { onConflict: 'driver_id' });
}

export async function joinQueue({ driver_id, zone = 'NUKUS_AVTOVOKZAL' }) {
  if (!supabase) throw new Error('Supabase client topilmadi');
  return supabase.from(TBL_QUEUE).insert([{ driver_id, zone, created_at: new Date().toISOString() }]);
}

export async function getQueuePosition({ driver_id, zone = 'NUKUS_AVTOVOKZAL' }) {
  if (!supabase) throw new Error('Supabase client topilmadi');
  const { data, error } = await supabase
    .from(TBL_QUEUE)
    .select('id, driver_id, created_at')
    .eq('zone', zone)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const idx = (data || []).findIndex((x) => x.driver_id === driver_id);
  return { position: idx >= 0 ? idx + 1 : null, total: (data || []).length };
}

export async function listPremiumRequests() {
  if (!supabase) throw new Error('Supabase client topilmadi');
  return supabase
    .from(TBL_REQUESTS)
    .select('*')
    .in('status', ['new', 'pending'])
    .order('created_at', { ascending: false });
}

export async function acceptRequest({ request_id, driver_id }) {
  if (!supabase) throw new Error('Supabase client topilmadi');
  return supabase
    .from(TBL_REQUESTS)
    .update({ status: 'accepted', driver_id, accepted_at: new Date().toISOString() })
    .eq('id', request_id);
}

export async function declineRequest({ request_id, driver_id }) {
  if (!supabase) throw new Error('Supabase client topilmadi');
  return supabase
    .from(TBL_REQUESTS)
    .update({ status: 'declined', driver_id, declined_at: new Date().toISOString() })
    .eq('id', request_id);
}
