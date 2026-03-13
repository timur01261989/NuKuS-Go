import { supabase } from "@/lib/supabase";
import { VEHICLE_TYPE_PRESETS } from "@/features/driver/DriverRegistration/uploadConfig";

function normalizeStatus(v){ return typeof v === "string" ? v.trim().toLowerCase() : null; }

function boolSettingsToServiceTypes(row = {}) {
  return {
    city: { passenger: !!row.city_passenger, delivery: !!row.city_delivery, freight: !!row.city_freight },
    intercity: { passenger: !!row.intercity_passenger, delivery: !!row.intercity_delivery, freight: !!row.intercity_freight },
    interdistrict: { passenger: !!row.interdistrict_passenger, delivery: !!row.interdistrict_delivery, freight: !!row.interdistrict_freight },
  };
}

export function serviceTypesToAllowedServices(serviceTypes = {}) {
  const out = new Set();
  if (serviceTypes?.city?.passenger) out.add("taxi");
  if (serviceTypes?.city?.delivery || serviceTypes?.intercity?.delivery || serviceTypes?.interdistrict?.delivery) out.add("delivery");
  if (serviceTypes?.city?.freight || serviceTypes?.intercity?.freight || serviceTypes?.interdistrict?.freight) out.add("freight");
  if (serviceTypes?.interdistrict?.passenger || serviceTypes?.interdistrict?.delivery || serviceTypes?.interdistrict?.freight) out.add("inter_district");
  if (serviceTypes?.intercity?.passenger || serviceTypes?.intercity?.delivery || serviceTypes?.intercity?.freight) out.add("inter_city");
  return [...out];
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
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("driver_applications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("driver_service_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("vehicles").select("*").eq("user_id", userId).order("is_active", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("driver_presence").select("*").eq("driver_id", userId).maybeSingle(),
  ]);

  const profile = profileRes.data || null;
  const application = appRes.data || null;
  const serviceSettings = settingsRes.data || null;
  const vehicles = Array.isArray(vehiclesRes.data) ? vehiclesRes.data.map(normalizeVehicle) : [];
  let activeVehicle = vehicles.find((v) => v.is_active) || null;
  if (!activeVehicle && profile?.active_vehicle_id) activeVehicle = vehicles.find((v) => v.id === profile.active_vehicle_id) || null;
  if (!activeVehicle && vehicles.length) activeVehicle = vehicles[0];
  const serviceTypes = boolSettingsToAllowedServices(serviceSettings || {});
  const allowedServices = serviceTypesToAllowedServices(serviceTypes);
  const appStatus = normalizeStatus(application?.status);
  const driverApproved = appStatus === "approved";

  return {
    profile,
    application,
    applicationStatus: appStatus,
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
