import { supabase } from "@/lib/supabase";
import { startHeartbeat, stopHeartbeat } from "@/native/driverHeartbeat";
import { getLatestTrackingPosition, startTracking } from "@/features/driver/components/services/locationService";

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

async function postPresenceState(body) {
  const driverId = await resolveDriverId();
  const token = await getAuthToken();
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  await fetch(`${getApiBase()}/api/driver-state`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }).catch(() => {});
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
