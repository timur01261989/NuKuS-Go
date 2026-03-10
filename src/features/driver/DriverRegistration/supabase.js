// UniGo Driver Supabase Service
// Fixed version compatible with driver_applications + driver_documents tables

import { supabase } from "@/lib/supabase";
import { DRIVER_DOCUMENT_FIELDS, DRIVER_DOCUMENT_FIELD_MAP } from "./uploadConfig";

const DOCUMENT_BUCKET = "driver-documents";

export async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) throw new Error(error.message);
  if (!user) throw new Error("User not authenticated");

  return user;
}

export async function getMyDriverApplicationWithDocuments() {
  const user = await getAuthenticatedUser();

  const { data: application, error } = await supabase
    .from("driver_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!application) return { application: null, documents: [] };

  const { data: documents, error: docError } = await supabase
    .from("driver_documents")
    .select("*")
    .eq("application_id", application.id);

  if (docError) throw new Error(docError.message);

  return {
    application,
    documents: documents || []
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

    transport_type: formData.vehicleType || null,

    vehicle_brand: formData.brand || null,
    vehicle_model: formData.model || null,
    vehicle_year: formData.year ? Number(formData.year) : null,
    vehicle_plate: formData.plateNumber || null,
    vehicle_color: formData.color || null,

    seat_count: formData.seats ? Number(formData.seats) : null,
    requested_max_freight_weight_kg: formData.cargoKg ? Number(formData.cargoKg) : null,
    requested_payload_volume_m3: formData.cargoM3 ? Number(formData.cargoM3) : null,

    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("driver_applications")
    .upsert(payload)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data;
}
