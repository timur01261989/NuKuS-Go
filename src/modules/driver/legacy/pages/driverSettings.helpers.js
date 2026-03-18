import { supabase } from "@/services/supabase/supabaseClient";
import {
  getDefaultServiceTypes,
  SERVICE_AREA_OPTIONS,
  SERVICE_TYPE_OPTIONS,
} from "@/modules/driver/registration/uploadConfig.js";

export const CARD_STYLE = {
  borderRadius: 20,
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "rgba(15, 23, 42, 0.9)",
  color: "#e2e8f0",
};

export const SECTION_LABEL_STYLE = { color: "#cbd5e1", fontWeight: 700 };

export function normalizeServiceTypes(rawValue, fallbackVehicleType = "light_car") {
  const defaults = getDefaultServiceTypes(fallbackVehicleType);
  if (!rawValue) return defaults;
  if (typeof rawValue === "string") {
    try {
      return normalizeServiceTypes(JSON.parse(rawValue), fallbackVehicleType);
    } catch (_error) {
      return defaults;
    }
  }

  const hasNestedShape = rawValue?.city || rawValue?.intercity || rawValue?.interdistrict;
  if (hasNestedShape) {
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

  return {
    city: {
      passenger: !!rawValue?.city_passenger,
      delivery: !!rawValue?.city_delivery,
      freight: !!rawValue?.city_freight,
    },
    intercity: {
      passenger: !!rawValue?.intercity_passenger,
      delivery: !!rawValue?.intercity_delivery,
      freight: !!rawValue?.intercity_freight,
    },
    interdistrict: {
      passenger: !!rawValue?.interdistrict_passenger,
      delivery: !!rawValue?.interdistrict_delivery,
      freight: !!rawValue?.interdistrict_freight,
    },
  };
}

export function flattenServiceTypes(serviceTypes) {
  return {
    city_passenger: !!serviceTypes?.city?.passenger,
    city_delivery: !!serviceTypes?.city?.delivery,
    city_freight: !!serviceTypes?.city?.freight,
    intercity_passenger: !!serviceTypes?.intercity?.passenger,
    intercity_delivery: !!serviceTypes?.intercity?.delivery,
    intercity_freight: !!serviceTypes?.intercity?.freight,
    interdistrict_passenger: !!serviceTypes?.interdistrict?.passenger,
    interdistrict_delivery: !!serviceTypes?.interdistrict?.delivery,
    interdistrict_freight: !!serviceTypes?.interdistrict?.freight,
  };
}

export function hasEnabledService(serviceTypes = {}) {
  return SERVICE_AREA_OPTIONS.some((area) =>
    SERVICE_TYPE_OPTIONS.some((service) => !!serviceTypes?.[area.key]?.[service.key])
  );
}

export function vehicleRowToUi(row) {
  if (!row) return null;

  return {
    id: row.id,
    vehicleType:
      row.vehicle_type ||
      row.requested_vehicle_type ||
      row.body_type ||
      row.transport_type ||
      "light_car",
    brand: row.brand || row.vehicle_brand || row.title || "",
    model: row.model || row.vehicle_model || "",
    plateNumber: row.plate_number || row.plate || row.vehicle_plate || "",
    color: row.color || row.vehicle_color || "",
    seats: row.seat_count ?? row.seats ?? 0,
    cargoKg:
      row.max_weight_kg ??
      row.capacity_kg ??
      row.requested_max_freight_weight_kg ??
      0,
    cargoM3:
      row.max_volume_m3 ??
      row.capacity_m3 ??
      row.requested_payload_volume_m3 ??
      0,
    approvalStatus: row.approval_status || row.status || "approved",
    isActive: !!row.is_active,
    year: row.year || row.vehicle_year || null,
    createdAt: row.created_at || null,
  };
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Foydalanuvchi topilmadi");
  return user;
}

export async function safeSelectDriverServiceSettings(userId) {
  const result = await supabase
    .from("driver_service_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    const errorText = String(result.error.message || "").toLowerCase();
    if (errorText.includes("does not exist") || errorText.includes("relation")) {
      return { data: null, error: null, missingTable: true };
    }
  }

  return { ...result, missingTable: false };
}

export async function safeSelectVehicles(userId) {
  let result = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", userId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    const errorText = String(result.error.message || "").toLowerCase();
    if (!errorText.includes("does not exist") && !errorText.includes("relation")) {
      return { ...result, missingTable: false };
    }

    result = await supabase
      .from("driver_vehicle_requests")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    return { ...result, missingTable: true };
  }

  return { ...result, missingTable: false };
}

export async function safeSelectVehicleRequests(userId) {
  const result = await supabase
    .from("driver_vehicle_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (result.error) {
    const errorText = String(result.error.message || "").toLowerCase();
    if (errorText.includes("does not exist") || errorText.includes("relation")) {
      return { data: [], error: null, missingTable: true };
    }
  }

  return { ...result, missingTable: false };
}
