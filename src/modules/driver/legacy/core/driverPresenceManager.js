import { supabase } from "@/services/supabase/supabaseClient";
import { startHeartbeat, stopHeartbeat } from "@/native/driverHeartbeat";
import { getLatestTrackingPosition, startTracking } from "@/modules/driver/legacy/components/services/locationService.js";

let currentService = null;
let currentDriverId = null;

function getActiveVehicleIdFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("driver_active_vehicle_id") || null;
  } catch {
    return null;
  }
}

function getCachedServiceTypes() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("driver_service_types_cache");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getApiBase() {
  return (import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "");
}

async function resolveDriverId() {
  if (currentDriverId) return currentDriverId;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data?.user?.id;
  if (!userId) throw new Error("driver_not_authenticated");
  currentDriverId = userId;
  return userId;
}

async function getAuthToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

async function fallbackPresenceSync(driverId, body) {
  const now = new Date().toISOString();
  try {
    await supabase.from('driver_presence').upsert({
      driver_id: driverId,
      is_online: !!body?.is_online,
      state: body?.is_online === false ? 'offline' : 'online',
      active_service_type: body?.service_type || null,
      updated_at: now,
      last_seen_at: now,
    }, { onConflict: 'driver_id' });
  } catch (error) {
    console.warn('driver_presence fallback failed', error?.message || error);
  }

}

async function postPresenceState(body) {
  const driverId = await resolveDriverId();
  const token = await getAuthToken();
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${getApiBase()}/api/driver-state`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const payload = await res.text().catch(() => '');
      throw new Error(payload || `HTTP ${res.status}`);
    }
    return true;
  } catch (error) {
    console.warn('driver-state api failed, using fallback sync:', error?.message || error);
    await fallbackPresenceSync(driverId, body);
    return false;
  }
}

export async function syncPresenceService(serviceType) {
  currentService = serviceType || null;
  if (!currentDriverId) return;
  await postPresenceState({
    is_online: true,
    service_type: currentService || 'taxi',
    active_vehicle_id: getActiveVehicleIdFromStorage(),
    service_types: getCachedServiceTypes(),
  });
}

export async function startPresence(serviceType) {
  currentService = serviceType || currentService || "taxi";
  const driverId = await resolveDriverId();
  startTracking(() => {});
  startHeartbeat({
    driverId,
    baseUrl: getApiBase(),
    getPosition: async () => getLatestTrackingPosition(),
    getServiceType: async () => currentService || "taxi",
    getAuthToken,
  });
  await postPresenceState({
    is_online: true,
    service_type: currentService || 'taxi',
    active_vehicle_id: getActiveVehicleIdFromStorage(),
    service_types: getCachedServiceTypes(),
  });
}

export async function stopPresence() {
  stopHeartbeat();
  if (!currentDriverId) return;
  await postPresenceState({
    is_online: false,
    service_type: currentService || null,
    active_vehicle_id: getActiveVehicleIdFromStorage(),
    service_types: getCachedServiceTypes(),
  });
}
