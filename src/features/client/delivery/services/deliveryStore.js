import { supabase } from "@/lib/supabase";

const LS_KEY = "unigo_delivery_orders_v2";
const TRIP_SETTINGS_KEY = "unigo_delivery_trip_settings_v1";

function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeParse(value, fallback) {
  try {
    return JSON.parse(value ?? "");
  } catch {
    return fallback;
  }
}

function lsRead() {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(LS_KEY), []);
}

function lsWrite(items) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(items || []));
}

function normalizeOrder(input = {}) {
  return {
    id: input.id || uid("delivery"),
    created_at: input.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: input.created_by || null,
    service_mode: input.service_mode || "city",
    status: input.status || "searching",
    parcel_type: input.parcel_type || "document",
    parcel_label: input.parcel_label || "Hujjat",
    weight_kg: Number(input.weight_kg || 0),
    price: Number(input.price || 0),
    commission_amount: Number(input.commission_amount || 0),
    payment_method: input.payment_method || "cash",
    comment: input.comment || "",
    receiver_name: input.receiver_name || "",
    receiver_phone: input.receiver_phone || "",
    sender_phone: input.sender_phone || "",
    pickup_mode: input.pickup_mode || "precise",
    dropoff_mode: input.dropoff_mode || "precise",
    pickup_region: input.pickup_region || "",
    pickup_district: input.pickup_district || "",
    pickup_label: input.pickup_label || "",
    pickup_lat: input.pickup_lat ?? null,
    pickup_lng: input.pickup_lng ?? null,
    dropoff_region: input.dropoff_region || "",
    dropoff_district: input.dropoff_district || "",
    dropoff_label: input.dropoff_label || "",
    dropoff_lat: input.dropoff_lat ?? null,
    dropoff_lng: input.dropoff_lng ?? null,
    matched_trip_id: input.matched_trip_id || null,
    matched_trip_title: input.matched_trip_title || "",
    matched_driver_id: input.matched_driver_id || null,
    matched_driver_name: input.matched_driver_name || "",
    history: Array.isArray(input.history) ? input.history : [],
  };
}

async function trySupabaseSelect() {
  try {
    const { data, error } = await supabase.from("delivery_orders").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch {
    return null;
  }
}

async function trySupabaseInsert(order) {
  try {
    const { data, error } = await supabase.from("delivery_orders").insert(order).select("*").single();
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

async function trySupabaseUpdate(id, patch) {
  try {
    const { data, error } = await supabase.from("delivery_orders").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

export async function listDeliveryOrders() {
  const remote = await trySupabaseSelect();
  if (Array.isArray(remote)) return remote;
  return lsRead();
}

export async function createDeliveryOrder(payload) {
  const order = normalizeOrder(payload);
  const remote = await trySupabaseInsert(order);
  if (remote) return remote;
  const items = lsRead();
  items.unshift(order);
  lsWrite(items);
  return order;
}

export async function updateDeliveryOrder(id, patch) {
  const nextPatch = { ...patch, updated_at: new Date().toISOString() };
  const remote = await trySupabaseUpdate(id, nextPatch);
  if (remote) return remote;
  const items = lsRead();
  const updated = items.map((item) => (item.id === id ? { ...item, ...nextPatch } : item));
  lsWrite(updated);
  return updated.find((item) => item.id === id) || null;
}

export async function appendDeliveryHistory(id, event) {
  const items = await listDeliveryOrders();
  const target = items.find((item) => item.id === id);
  if (!target) return null;
  const history = [
    ...(Array.isArray(target.history) ? target.history : []),
    { id: uid("evt"), at: new Date().toISOString(), ...event },
  ];
  return updateDeliveryOrder(id, { history });
}

export async function listOpenIntercityTrips() {
  try {
    const { data, error } = await supabase
      .from("interprov_trips")
      .select("*")
      .eq("is_delivery", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export function getTripSettingsMap() {
  if (typeof window === "undefined") return {};
  return safeParse(localStorage.getItem(TRIP_SETTINGS_KEY), {});
}

export function saveTripSettings(tripId, patch) {
  if (typeof window === "undefined" || !tripId) return;
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
