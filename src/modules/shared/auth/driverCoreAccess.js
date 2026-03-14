import { supabase } from "../../../services/supabase/supabaseClient.js";
import { VEHICLE_TYPE_PRESETS } from "../../driver/registration/uploadConfig.js";

const PROFILE_SELECTORS = [
  "id,phone,phone_normalized,role,current_role,active_vehicle_id",
  "id,phone,role,current_role,active_vehicle_id",
  "id,phone,role,current_role",
  "id,phone,role",
];
const DRIVER_APPLICATION_SELECTORS = [
  "id,user_id,status,vehicle_type,brand,model,plate_number,requested_max_weight_kg,requested_max_volume_m3,seat_count,created_at",
  "id,user_id,status,vehicle_type,brand,model,plate_number,seat_count,created_at",
  "id,user_id,status,transport_type,brand,model,plate_number,created_at",
  "id,user_id,status,created_at",
];
const DRIVER_SETTINGS_COLUMNS = [
  "user_id",
  "city_passenger",
  "city_delivery",
  "city_freight",
  "intercity_passenger",
  "intercity_delivery",
  "intercity_freight",
  "interdistrict_passenger",
  "interdistrict_delivery",
  "interdistrict_freight",
].join(",");
const VEHICLE_COLUMNS = "id,user_id,vehicle_type,brand,model,plate_number,seat_count,max_weight_kg,max_volume_m3,approval_status,status,is_active,created_at";
const PRESENCE_COLUMNS = "driver_id,is_online,last_seen_at,current_order_id,updated_at";

function normalizeStatus(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

async function trySingleQuery(builders) {
  let lastError = null;
  for (const build of builders) {
    const result = await build();
    if (!result.error) {
      return { data: result.data || null, error: null };
    }
    lastError = result.error;
    const message = String(result.error?.message || '').toLowerCase();
    if (!message.includes('column') && !message.includes('relation')) {
      return { data: null, error: result.error };
    }
  }
  return { data: null, error: lastError };
}

async function tryListQuery(builders) {
  let lastError = null;
  for (const build of builders) {
    const result = await build();
    if (!result.error) {
      return { data: Array.isArray(result.data) ? result.data : [], error: null };
    }
    lastError = result.error;
    const message = String(result.error?.message || '').toLowerCase();
    if (!message.includes('column') && !message.includes('relation')) {
      return { data: [], error: result.error };
    }
  }
  return { data: [], error: lastError };
}

function boolSettingsToServiceTypes(row = {}) {
  return {
    city: {
      passenger: !!row.city_passenger,
      delivery: !!row.city_delivery,
      freight: !!row.city_freight,
    },
    intercity: {
      passenger: !!row.intercity_passenger,
      delivery: !!row.intercity_delivery,
      freight: !!row.intercity_freight,
    },
    interdistrict: {
      passenger: !!row.interdistrict_passenger,
      delivery: !!row.interdistrict_delivery,
      freight: !!row.interdistrict_freight,
    },
  };
}

export function serviceTypesToAllowedServices(serviceTypes = {}) {
  const output = new Set();

  if (serviceTypes?.city?.passenger) output.add("taxi");
  if (serviceTypes?.city?.delivery || serviceTypes?.intercity?.delivery || serviceTypes?.interdistrict?.delivery) output.add("delivery");
  if (serviceTypes?.city?.freight || serviceTypes?.intercity?.freight || serviceTypes?.interdistrict?.freight) output.add("freight");
  if (serviceTypes?.interdistrict?.passenger || serviceTypes?.interdistrict?.delivery || serviceTypes?.interdistrict?.freight) output.add("inter_district");
  if (serviceTypes?.intercity?.passenger || serviceTypes?.intercity?.delivery || serviceTypes?.intercity?.freight) output.add("inter_city");

  return [...output];
}

function normalizeVehicle(row = {}) {
  const preset = VEHICLE_TYPE_PRESETS[row.vehicle_type] || null;

  return {
    id: row.id,
    vehicle_type: row.vehicle_type || "light_car",
    brand: row.brand || row.vehicle_brand || "",
    model: row.model || row.vehicle_model || "",
    plate_number: row.plate_number || row.vehicle_plate || "",
    seat_count: Number(row.seat_count || row.seats || preset?.seats || 0),
    max_weight_kg: Number(row.max_weight_kg || row.requested_max_weight_kg || preset?.cargoKg || 0),
    max_volume_m3: Number(row.max_volume_m3 || row.requested_max_volume_m3 || preset?.cargoM3 || 0),
    approval_status: row.approval_status || row.status || "pending",
    is_active: !!row.is_active,
  };
}

export async function fetchDriverCore(userId) {
  if (!userId) return null;

  const [profileRes, appRes, settingsRes, vehiclesRes, presenceRes] = await Promise.all([
    trySingleQuery(PROFILE_SELECTORS.map((columns) => () => supabase.from("profiles").select(columns).eq("id", userId).maybeSingle())),
    trySingleQuery(DRIVER_APPLICATION_SELECTORS.map((columns) => () => supabase.from("driver_applications").select(columns).eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle())),
    trySingleQuery([
      () => supabase.from("driver_service_settings").select(DRIVER_SETTINGS_COLUMNS).eq("user_id", userId).maybeSingle(),
      () => Promise.resolve({ data: null, error: null }),
    ]),
    tryListQuery([
      () => supabase.from("vehicles").select(VEHICLE_COLUMNS).eq("user_id", userId).order("is_active", { ascending: false }).order("created_at", { ascending: false }),
      () => supabase.from("vehicles").select("id,driver_id,vehicle_type,brand,model,plate_number,seat_count,max_weight_kg,max_volume_m3,approval_status,status,is_active,created_at").eq("driver_id", userId).order("is_active", { ascending: false }).order("created_at", { ascending: false }),
      () => Promise.resolve({ data: [], error: null }),
    ]),
    trySingleQuery([
      () => supabase.from("driver_presence").select(PRESENCE_COLUMNS).eq("driver_id", userId).maybeSingle(),
      () => supabase.from("driver_presence").select("driver_id,is_online,last_seen,updated_at").eq("driver_id", userId).maybeSingle(),
      () => Promise.resolve({ data: null, error: null }),
    ]),
  ]);

  const profile = profileRes.data || null;
  const application = appRes.data ? {
    ...appRes.data,
    vehicle_type: appRes.data.vehicle_type || appRes.data.transport_type || null,
  } : null;
  const serviceSettings = settingsRes.data || null;
  const vehicles = Array.isArray(vehiclesRes.data) ? vehiclesRes.data.map(normalizeVehicle) : [];

  let activeVehicle = vehicles.find((vehicle) => vehicle.is_active) || null;
  if (!activeVehicle && profile?.active_vehicle_id) {
    activeVehicle = vehicles.find((vehicle) => vehicle.id === profile.active_vehicle_id) || null;
  }
  if (!activeVehicle && vehicles.length) {
    activeVehicle = vehicles[0];
  }

  const serviceTypes = boolSettingsToServiceTypes(serviceSettings || {});
  const allowedServices = serviceTypesToAllowedServices(serviceTypes);
  const applicationStatus = normalizeStatus(application?.status);
  const driverApproved = ["approved", "active", "verified", "enabled", "ok"].includes(applicationStatus || '');

  return {
    profile,
    application,
    applicationStatus,
    driverApproved,
    driverExists: !!application,
    serviceSettings,
    serviceTypes,
    allowedServices,
    vehicles,
    activeVehicle,
    presence: presenceRes.data || null,
  };
}

export default fetchDriverCore;
