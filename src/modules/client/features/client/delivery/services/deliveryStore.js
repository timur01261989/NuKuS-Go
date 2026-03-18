import {
  createDeliveryOrderApi,
  deleteDeliveryOrderApi,
  listMyDeliveryOrders,
  updateDeliveryOrderApi,
} from '@/services/deliveryApi.js';
import { normalizeDeliveryOrder, normalizeDeliveryStatus } from '@/modules/shared/domain/delivery/statusMap.js';
import { supabase } from '@/services/supabase/supabaseClient';

const TRIP_SETTINGS_KEY = 'unigo_delivery_trip_settings_v1';

function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeParse(value, fallback) {
  try {
    return JSON.parse(value ?? '');
  } catch {
    return fallback;
  }
}

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data?.user?.id || null;
  if (!userId) throw new Error('Login qiling');
  return userId;
}


function normalizeOrder(input = {}, userId) {
  return normalizeDeliveryOrder({
    ...input,
    id: input.id || uid('delivery'),
    user_id: input.user_id || userId,
    driver_user_id: input.driver_user_id || null,
    created_at: input.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: input.created_by || userId,
    status: normalizeDeliveryStatus(input.status || 'searching'),
    history: Array.isArray(input.history) ? input.history : [],
  });
}


export async function listDeliveryOrders() {
  await requireUserId();
  const response = await listMyDeliveryOrders();
  return Array.isArray(response?.orders) ? response.orders.map((item) => normalizeOrder(item)) : [];
}

export async function createDeliveryOrder(payload) {
  const userId = await requireUserId();
  const order = normalizeOrder(payload, userId);
  const response = await createDeliveryOrderApi(order);
  return response.order;
}

export async function updateDeliveryOrder(id, patch) {
  await requireUserId();
  const nextPatch = { ...patch, updated_at: new Date().toISOString() };
  const response = await updateDeliveryOrderApi(id, nextPatch);
  return response.order;
}

export async function deleteDeliveryOrder(id) {
  await requireUserId();
  await deleteDeliveryOrderApi(id);
  return true;
}

export async function appendDeliveryHistory(id, event) {
  const items = await listDeliveryOrders();
  const target = items.find((item) => item.id === id);
  if (!target) return null;
  const history = [
    ...(Array.isArray(target.history) ? target.history : []),
    { id: uid('evt'), at: new Date().toISOString(), ...event },
  ];
  return updateDeliveryOrder(id, { history });
}

export async function listOpenIntercityTrips() {
  try {
    const { data, error } = await supabase
      .from('interprov_trips')
      .select('*')
      .eq('is_delivery', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export function getTripSettingsMap() {
  if (typeof window === 'undefined') return {};
  return safeParse(localStorage.getItem(TRIP_SETTINGS_KEY), {});
}

export function saveTripSettings(tripId, patch) {
  if (typeof window === 'undefined' || !tripId) return;
  const map = getTripSettingsMap();
  map[tripId] = { ...(map[tripId] || {}), ...(patch || {}) };
  localStorage.setItem(TRIP_SETTINGS_KEY, JSON.stringify(map));
}

export function getTripSettings(tripId) {
  return getTripSettingsMap()[tripId] || null;
}

export function calcDeliveryCommission(price) {
  return Math.round(Number(price || 0) * 0.1);
}
