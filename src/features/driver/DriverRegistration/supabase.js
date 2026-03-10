import { supabase } from "@/lib/supabase";
import { DRIVER_DOCUMENT_FIELDS } from "./uploadConfig";

const DOCUMENT_BUCKET = "driver-documents";

export async function getAuthenticatedUser() {

  const { data: { user }, error } =
    await supabase.auth.getUser();

  if (error) throw new Error(error.message);
  if (!user) throw new Error("Login qilinmagan");

  return user;
}

export async function getMyDriverApplicationWithDocuments() {

  const user = await getAuthenticatedUser();

  const { data: application, error } =
    await supabase
      .from("driver_applications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

  if (error) throw new Error(error.message);

  if (!application)
    return { application: null, documents: [] };

  const { data: documents, error: docsError } =
    await supabase
      .from("driver_documents")
      .select("*")
      .eq("application_id", application.id);

  if (docsError) throw new Error(docsError.message);

  return {
    application,
    documents: documents || [],
  };
}

export function buildFormDataFromApplication(application) {

  if (!application) return null;

  return {

    lastName: application.last_name || "",
    firstName: application.first_name || "",
    middleName: application.middle_name || "",

    phone: application.phone || "",
    passportNumber: application.passport_number || "",

    vehicleType: application.transport_type || "",

    brand: application.vehicle_brand || "",
    model: application.vehicle_model || "",
    plateNumber: application.vehicle_plate || "",

    year: application.vehicle_year || "",
    color: application.vehicle_color || "",

    seats: application.seat_count || 4,

    cargoKg:
      application.requested_max_freight_weight_kg || "",

    cargoM3:
      application.requested_payload_volume_m3 || "",

  };
}

export async function upsertDriverApplication(formData) {

  const user = await getAuthenticatedUser();

  const payload = {

    user_id: user.id,

    status: "pending",

    last_name: formData.lastName || null,
    first_name: formData.firstName || null,
    middle_name: formData.middleName || null,

    phone: formData.phone || null,
    passport_number: formData.passportNumber || null,

    transport_type: formData.vehicleType,

    vehicle_brand: formData.brand || null,
    vehicle_model: formData.model || null,
    vehicle_year: formData.year
      ? Number(formData.year)
      : null,

    vehicle_plate: formData.plateNumber || null,
    vehicle_color: formData.color || null,

    seat_count: formData.seats
      ? Number(formData.seats)
      : null,

    requested_max_freight_weight_kg:
      formData.cargoKg
        ? Number(formData.cargoKg)
        : null,

    requested_payload_volume_m3:
      formData.cargoM3
        ? Number(formData.cargoM3)
        : null,

    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

  };

  const existing =
    await getMyDriverApplicationWithDocuments();

  if (existing.application?.id) {

    const { data, error } =
      await supabase
        .from("driver_applications")
        .update(payload)
        .eq("id", existing.application.id)
        .select("*")
        .single();

    if (error) throw new Error(error.message);

    return data;
  }

  const { data, error } =
    await supabase
      .from("driver_applications")
      .insert(payload)
      .select("*")
      .single();

  if (error) throw new Error(error.message);

  return data;
}