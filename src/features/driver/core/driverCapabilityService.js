
import { supabase } from "@/lib/supabase";
import { getDefaultServiceTypes } from "@/features/driver/DriverRegistration/uploadConfig";

export const ACTIVE_VEHICLE_STORAGE_KEY = "driver_active_vehicle_id";

function normalizeServiceTypes(rawValue, fallbackVehicleType = "light_car") {
  if (!rawValue) return getDefaultServiceTypes(fallbackVehicleType);
  if (typeof rawValue === "string") {
    try {
      return normalizeServiceTypes(JSON.parse(rawValue), fallbackVehicleType);
    } catch {
      return getDefaultServiceTypes(fallbackVehicleType);
    }
  }
  return {
    city: {
      passenger: !!rawValue?.city?.passenger,
      delivery: !!rawValue?.city?.delivery,
      freight: !!rawValue?.city?.freight,
    },
    intercity: {
      passenger: !!rawValue?.intercity?.passenger,
      delivery: !!rawValue?.intercity?.delivery,
      freight: !!rawValue?.intercity?.freight,
    },
    interdistrict: {
      passenger: !!rawValue?.interdistrict?.passenger,
      delivery: !!rawValue?.interdistrict?.delivery,
      freight: !!rawValue?.interdistrict?.freight,
    },
  };
}

function normalizeVehicleRow(row = {}) {
  return {
    id: row.id,
    userId: row.user_id || row.driver_id || null,
    vehicleType: row.vehicle_type || row.requested_vehicle_type || row.transport_type || row.body_type || "light_car",
    brand: row.brand || row.vehicle_brand || row.title || "",
    model: row.model || row.vehicle_model || "",
    plateNumber: row.plate_number || row.vehicle_plate || row.plate || "",
    seatCount: Number(row.seat_count ?? row.seats ?? 0),
    maxWeightKg: Number(row.max_weight_kg ?? row.capacity_kg ?? row.requested_max_freight_weight_kg ?? 0),
    maxVolumeM3: Number(row.max_volume_m3 ?? row.capacity_m3 ?? row.requested_payload_volume_m3 ?? 0),
    approvalStatus: row.approval_status || row.status || "approved",
    isActive: !!row.is_active,
    createdAt: row.created_at || null,
  };
}

function buildFallbackVehicle(application) {
  if (!application) return null;
  return normalizeVehicleRow({
    id: `application_${application.user_id || 'vehicle'}`,
    user_id: application.user_id,
    vehicle_type: application.requested_vehicle_type || application.transport_type || 'light_car',
    vehicle_brand: application.vehicle_brand,
    vehicle_model: application.vehicle_model,
    vehicle_plate: application.vehicle_plate,
    seat_count: application.seat_count,
    requested_max_freight_weight_kg: application.requested_max_freight_weight_kg,
    requested_payload_volume_m3: application.requested_payload_volume_m3,
    approval_status: application.status || 'approved',
    is_active: true,
    created_at: application.created_at,
  });
}

async function safeGetUserId(explicitUserId = null) {
  if (explicitUserId) return explicitUserId;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id || null;
}

async function safeSelectApplication(userId) {
  const { data, error } = await supabase
    .from('driver_applications')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function safeSelectServiceSettings(userId) {
  const result = await supabase
    .from('driver_service_settings')
    .select('service_types')
    .eq('user_id', userId)
    .maybeSingle();

  if (result.error) {
    const msg = String(result.error.message || '').toLowerCase();
    if (msg.includes('relation') || msg.includes('does not exist')) return null;
    throw result.error;
  }
  return result.data || null;
}

async function safeSelectVehicles(userId) {
  let result = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false });

  if (result.error) {
    const msg = String(result.error.message || '').toLowerCase();
    if (!msg.includes('column') && !msg.includes('does not exist')) throw result.error;
    result = await supabase
      .from('vehicles')
      .select('*')
      .eq('driver_id', userId)
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false });
    if (result.error) throw result.error;
  }
  return result.data || [];
}

function pickActiveVehicle(vehicles = [], fallbackVehicle = null) {
  if (typeof window !== 'undefined') {
    const storedVehicleId = localStorage.getItem(ACTIVE_VEHICLE_STORAGE_KEY);
    if (storedVehicleId) {
      const storedVehicle = vehicles.find((item) => item.id === storedVehicleId);
      if (storedVehicle) return storedVehicle;
    }
  }
  return vehicles.find((item) => item.isActive) || vehicles[0] || fallbackVehicle || null;
}

export async function fetchDriverCapability(userId = null) {
  const resolvedUserId = await safeGetUserId(userId);
  if (!resolvedUserId) return null;

  const [application, serviceSettings, vehicleRows] = await Promise.all([
    safeSelectApplication(resolvedUserId),
    safeSelectServiceSettings(resolvedUserId),
    safeSelectVehicles(resolvedUserId),
  ]);

  const normalizedVehicles = vehicleRows.map(normalizeVehicleRow);
  const fallbackVehicle = buildFallbackVehicle(application);
  const activeVehicle = pickActiveVehicle(normalizedVehicles, fallbackVehicle);
  const vehicleType = activeVehicle?.vehicleType || application?.requested_vehicle_type || application?.transport_type || 'light_car';
  const serviceTypes = normalizeServiceTypes(serviceSettings?.service_types || application?.requested_service_types, vehicleType);

  return {
    userId: resolvedUserId,
    application,
    serviceTypes,
    vehicles: normalizedVehicles,
    activeVehicle,
  };
}

export async function fetchDriverCapabilitiesByUserIds(userIds = []) {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))];
  if (uniqueUserIds.length === 0) return new Map();

  const [settingsResult, vehiclesResult] = await Promise.all([
    supabase.from('driver_service_settings').select('user_id, service_types').in('user_id', uniqueUserIds),
    supabase.from('vehicles').select('*').in('user_id', uniqueUserIds).order('is_active', { ascending: false }),
  ]);

  const settingsMap = new Map();
  if (!settingsResult.error) {
    for (const row of settingsResult.data || []) settingsMap.set(row.user_id, row.service_types);
  }

  const vehiclesMap = new Map();
  if (!vehiclesResult.error) {
    for (const row of vehiclesResult.data || []) {
      const uid = row.user_id || row.driver_id;
      if (!uid) continue;
      if (!vehiclesMap.has(uid)) vehiclesMap.set(uid, []);
      vehiclesMap.get(uid).push(normalizeVehicleRow(row));
    }
  }

  const out = new Map();
  for (const userId of uniqueUserIds) {
    const vehicles = vehiclesMap.get(userId) || [];
    const activeVehicle = pickActiveVehicle(vehicles, null);
    const serviceTypes = normalizeServiceTypes(settingsMap.get(userId), activeVehicle?.vehicleType || 'light_car');
    out.set(userId, { userId, serviceTypes, vehicles, activeVehicle });
  }
  return out;
}

export function getServiceAreaFromKey(serviceKey) {
  switch (serviceKey) {
    case 'taxi':
      return 'city';
    case 'interProv':
    case 'inter_provincial':
    case 'intercity':
      return 'intercity';
    case 'interDist':
    case 'inter_district':
    case 'interdistrict':
      return 'interdistrict';
    default:
      return null;
  }
}

export function getOrderTypeFromKey(serviceKey) {
  if (serviceKey === 'delivery') return 'delivery';
  if (serviceKey === 'freight') return 'freight';
  return 'passenger';
}

export function canUseMenuService(capability, serviceKey) {
  const serviceTypes = capability?.serviceTypes || {};
  const area = getServiceAreaFromKey(serviceKey);
  if (area) {
    const bucket = serviceTypes?.[area] || {};
    return !!(bucket.passenger || bucket.delivery || bucket.freight);
  }
  if (serviceKey === 'delivery') {
    return ['city', 'intercity', 'interdistrict'].some((key) => !!serviceTypes?.[key]?.delivery);
  }
  if (serviceKey === 'freight') {
    return ['city', 'intercity', 'interdistrict'].some((key) => !!serviceTypes?.[key]?.freight);
  }
  return true;
}

export function canUseOrderTypeInArea(capability, serviceArea, orderType) {
  if (!serviceArea || !orderType) return false;
  return !!capability?.serviceTypes?.[serviceArea]?.[orderType];
}

export function getAreaCapability(serviceTypes, serviceArea) {
  const bucket = serviceTypes?.[serviceArea] || {};
  return {
    passenger: !!bucket.passenger,
    delivery: !!bucket.delivery,
    freight: !!bucket.freight,
  };
}

export function clampLoadToVehicle(capability, weightKg = 0, volumeM3 = 0) {
  const maxWeightKg = Number(capability?.activeVehicle?.maxWeightKg || 0);
  const maxVolumeM3 = Number(capability?.activeVehicle?.maxVolumeM3 || 0);
  return {
    maxWeightKg,
    maxVolumeM3,
    weightKg: Math.min(Number(weightKg || 0), maxWeightKg || Number(weightKg || 0)),
    volumeM3: Math.min(Number(volumeM3 || 0), maxVolumeM3 || Number(volumeM3 || 0)),
  };
}

export function canDriverHandleLoad(capability, weightKg = 0, volumeM3 = 0) {
  const activeVehicle = capability?.activeVehicle;
  if (!activeVehicle) return false;
  const safeWeight = Number(weightKg || 0);
  const safeVolume = Number(volumeM3 || 0);
  return safeWeight <= Number(activeVehicle.maxWeightKg || 0) && safeVolume <= Number(activeVehicle.maxVolumeM3 || 0);
}

export function canDriverSeeOrder(capability, order = {}) {
  const serviceArea = order.serviceArea || order.service_mode || order.service_area;
  const orderType = order.orderType || order.order_type || 'passenger';
  const weightKg = order.weightKg ?? order.weight_kg ?? 0;
  const volumeM3 = order.volumeM3 ?? order.volume_m3 ?? 0;
  if (!canUseOrderTypeInArea(capability, serviceArea, orderType)) return false;
  return canDriverHandleLoad(capability, weightKg, volumeM3);
}

export function syncCapabilityToStorage(capability) {
  if (typeof window === 'undefined') return;
  try {
    if (capability?.activeVehicle?.id) localStorage.setItem(ACTIVE_VEHICLE_STORAGE_KEY, capability.activeVehicle.id);
    if (capability?.serviceTypes) localStorage.setItem('driver_service_types_cache', JSON.stringify(capability.serviceTypes));
  } catch {
    // ignore
  }
}
