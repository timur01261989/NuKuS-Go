import { ORDER_ACTIVE_STATUSES } from './orderContract.js';

const ORDER_SELECT = [
  'id',
  'client_id',
  'driver_id',
  'service_type',
  'status',
  'price_uzs',
  'payment_method',
  'pickup',
  'dropoff',
  'route_meta',
  'passenger_count',
  'cargo_title',
  'cargo_weight_kg',
  'cargo_volume_m3',
  'note',
  'accepted_at',
  'arrived_at',
  'started_at',
  'completed_at',
  'cancelled_at',
  'offered_at',
  'created_at',
  'updated_at',
  'driver:profiles!orders_driver_id_fkey(id,full_name,phone,avatar_url)',
  'client:profiles!orders_client_id_fkey(id,full_name,phone,avatar_url)',
].join(',');

export function getOrderSelect() {
  return ORDER_SELECT;
}

export async function createOrderRecord(sb, payload) {
  const { data, error } = await sb.from('orders').insert([payload]).select(getOrderSelect()).single();
  if (error) throw error;
  return data;
}

export async function getOrderById(sb, orderId) {
  const { data, error } = await sb.from('orders').select(getOrderSelect()).eq('id', orderId).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getActiveOrderByClientId(sb, clientId) {
  const { data, error } = await sb
    .from('orders')
    .select(getOrderSelect())
    .eq('client_id', clientId)
    .in('status', ORDER_ACTIVE_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function updateOrderStatusRecord(sb, orderId, patch) {
  const { data, error } = await sb.from('orders').update(patch).eq('id', orderId).select(getOrderSelect()).single();
  if (error) throw error;
  return data;
}

export async function getActiveOffer(sb, orderId, isoNow) {
  const { data, error } = await sb
    .from('order_offers')
    .select('driver_id,expires_at')
    .eq('order_id', orderId)
    .eq('status', 'sent')
    .gt('expires_at', isoNow)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getOrderOffers(sb, orderId) {
  const { data, error } = await sb.from('order_offers').select('driver_id').eq('order_id', orderId).limit(5000);
  if (error) throw error;
  return data || [];
}

export async function findEligibleDrivers(sb, args) {
  const { data, error } = await sb.rpc('find_eligible_drivers', args);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function insertOrderOffers(sb, rows) {
  const { error } = await sb.from('order_offers').upsert(rows, { onConflict: 'order_id,driver_id' });
  if (error) throw error;
}

export async function upsertDriverPresence(sb, row) {
  const { error } = await sb.from('driver_presence').upsert([row], { onConflict: 'driver_id' });
  if (error) throw error;
}

export async function setDriverPresenceOnline(sb, driverId) {
  const now = new Date().toISOString();
  const { error } = await sb
    .from('driver_presence')
    .update({ state: 'online', current_order_id: null, updated_at: now, last_seen_at: now })
    .eq('driver_id', driverId);
  if (error) throw error;
}
