import { message } from "antd";
import { supabase } from "@/services/supabase/supabaseClient";
import { ACTIVE_VEHICLE_STORAGE_KEY } from "@/modules/driver/legacy/core/driverCapabilityService.js";
import { getVehiclePreset, toLegacyTransportType } from "@/modules/driver/registration/uploadConfig.js";
import {
  flattenServiceTypes,
  getCurrentUser,
  hasEnabledService,
  safeSelectDriverServiceSettings,
  safeSelectVehicleRequests,
  safeSelectVehicles,
  vehicleRowToUi,
} from "./driverSettings.helpers";

export async function loadDriverSettingsData() {
  const user = await getCurrentUser();

  const { data: applicationData, error: applicationError } = await supabase
    .from("driver_applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (applicationError) throw applicationError;

  const [serviceSettingsRows, vehicleRowsResponse, vehicleRequestRowsResponse] = await Promise.all([
    safeSelectDriverServiceSettings(user.id),
    safeSelectVehicles(user.id),
    safeSelectVehicleRequests(user.id),
  ]);

  const pickupRows = (vehicleRowsResponse?.data && Array.isArray(vehicleRowsResponse.data))
    ? vehicleRowsResponse.data
    : [];

  const requestRows = (vehicleRequestRowsResponse?.data && Array.isArray(vehicleRequestRowsResponse.data))
    ? vehicleRequestRowsResponse.data
    : [];

  const serviceRows = (serviceSettingsRows?.data && Array.isArray(serviceSettingsRows.data))
    ? serviceSettingsRows.data
    : serviceSettingsRows?.data ? [serviceSettingsRows.data] : [];

  return {
    user,
    applicationData: applicationData || null,
    serviceSettingsRows: serviceRows,
    vehicleRows: pickupRows,
    vehicleRequestRows: requestRows,
  };
}

export async function persistDriverServiceTypes(serviceTypes) {
  const user = await getCurrentUser();
  const now = new Date().toISOString();

  const flatServicePayload = flattenServiceTypes(serviceTypes);
  const servicePayload = {
    user_id: user.id,
    service_types: serviceTypes,
    ...flatServicePayload,
    updated_at: now,
  };

  let upsertSettings = await supabase
    .from("driver_service_settings")
    .upsert(servicePayload, { onConflict: "user_id" });

  if (upsertSettings.error) {
    const errorText = String(upsertSettings.error.message || "").toLowerCase();
    if (errorText.includes("service_types") && (errorText.includes("column") || errorText.includes("schema cache"))) {
      upsertSettings = await supabase
        .from("driver_service_settings")
        .upsert({ user_id: user.id, ...flatServicePayload, updated_at: now }, { onConflict: "user_id" });
    }
    if (upsertSettings.error) {
      const fallbackText = String(upsertSettings.error.message || "").toLowerCase();
      if (!fallbackText.includes("does not exist") && !fallbackText.includes("relation")) {
        throw upsertSettings.error;
      }
    }
  }

  const appUpdate = await supabase
    .from("driver_applications")
    .update({ requested_service_types: serviceTypes, updated_at: now })
    .eq("user_id", user.id);

  if (appUpdate.error) {
    const errorText = String(appUpdate.error.message || "").toLowerCase();
    if (!errorText.includes("does not exist")) {
      throw appUpdate.error;
    }
  }
}

export async function submitDriverVehicleRequest({ values, vehicleModalMode, editingVehicle }) {
  const user = await getCurrentUser();
  const payload = {
    vehicle_type: values.vehicleType,
    transport_type: toLegacyTransportType(values.vehicleType),
    service_types: values.serviceTypes,
    brand: values.brand?.trim() || getVehiclePreset(values.vehicleType).brand,
    model: values.model?.trim() || getVehiclePreset(values.vehicleType).model,
    plate_number: values.plateNumber?.trim() || "",
    color: values.color?.trim() || "",
    seat_count: Number(values.seats || 0),
    max_weight_kg: Number(values.maxWeightKg || 0),
    max_volume_m3: Number(values.maxVolumeM3 || 0),
    insurance_number: values.insuranceNumber?.trim() || "",
    notes: values.notes?.trim() || "",
  };

  const requestPayload = {
    user_id: user.id,
    request_type: vehicleModalMode === "edit" ? "update_vehicle" : "create_vehicle",
    status: "pending",
    payload,
    target_vehicle_id: vehicleModalMode === "edit" ? editingVehicle?.id || null : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("vehicle_change_requests")
    .insert(requestPayload);

  if (error) {
    const errorText = String(error.message || "").toLowerCase();
    if (errorText.includes("does not exist") || errorText.includes("relation") || errorText.includes("schema cache")) {
      message.warning("vehicle_change_requests jadvali hali yaratilmagan. SQL migratsiyani run qiling.");
      return { warnedMissingTable: true };
    }
    throw error;
  }

  return { warnedMissingTable: false };
}

export async function activateDriverVehicle(vehicleId) {
  const user = await getCurrentUser();
  const matchingRows = await safeSelectVehicles(user.id);
  const currentVehicles = matchingRows.map(vehicleRowToUi);
  const target = currentVehicles.find((item) => item.id === vehicleId);
  if (!target) {
    throw new Error("Mashina topilmadi");
  }

  for (const vehicle of currentVehicles) {
    const updatePayload = {
      is_active: vehicle.id === vehicleId,
      updated_at: new Date().toISOString(),
    };

    const updateByUser = await supabase
      .from("vehicles")
      .update(updatePayload)
      .eq("id", vehicle.id)
      .eq("user_id", user.id);

    if (updateByUser.error) {
      const errorText = String(updateByUser.error.message || "").toLowerCase();
      if (!errorText.includes("column") && !errorText.includes("does not exist")) {
        throw updateByUser.error;
      }

      const updateByDriver = await supabase
        .from("vehicles")
        .update(updatePayload)
        .eq("id", vehicle.id)
        .eq("driver_id", user.id);

      if (updateByDriver.error) throw updateByDriver.error;
    }
  }

  try {
    localStorage.setItem(ACTIVE_VEHICLE_STORAGE_KEY, vehicleId);
  } catch {
    // ignore
  }

  return target;
}

export function buildRegisterSummary(application) {
  return {
    vehicleType: application?.requested_vehicle_type || application?.vehicle_type || "light_car",
    transportType: application?.requested_transport_type || application?.transport_type || "taxi",
    brand: application?.vehicle_brand || "—",
    model: application?.vehicle_model || "—",
    plate: application?.vehicle_plate || "—",
    seats: application?.seat_count ?? 0,
    cargoKg: application?.requested_max_freight_weight_kg ?? 0,
    cargoM3: application?.requested_payload_volume_m3 ?? 0,
    status: application?.status || "pending",
  };
}

export function buildSettingsWarning(registerSummary, activeVehicle) {
  if (activeVehicle || hasEnabledService(registerSummary?.status)) {
    return null;
  }
  return null;
}
