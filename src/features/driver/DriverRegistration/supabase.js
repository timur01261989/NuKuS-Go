import { supabase } from "@/lib/supabase";
import { DRIVER_DOCUMENT_FIELDS, DRIVER_DOCUMENT_FIELD_MAP } from "./uploadConfig";

const DOCUMENT_BUCKET = "driver-documents";

function sanitizeSegment(value) {
  return String(value || "").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
}

function getFileExtension(file) {
  const fallback = String(file?.type || "").includes("png") ? "png" : "jpg";
  const name = String(file?.name || "");
  if (!name.includes(".")) return fallback;
  return String(name.split(".").pop() || fallback).toLowerCase();
}

export async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!user) throw new Error("Login qilinmagan");
  return user;
}

export async function getMyDriverApplicationWithDocuments() {
  const user = await getAuthenticatedUser();
  const { data: application, error: applicationError } = await supabase.from("driver_applications").select("*").eq("user_id", user.id).maybeSingle();
  if (applicationError) throw new Error(applicationError.message);
  if (!application) return { application: null, documents: [] };
  const { data: documents, error: documentsError } = await supabase.from("driver_documents").select("*").eq("application_id", application.id).order("created_at", { ascending: true });
  if (documentsError) throw new Error(documentsError.message);
  return { application, documents: documents || [] };
}

export function buildFormDataFromApplication(application) {
  if (!application) return null;
  return {
    lastName: application.last_name || "",
    firstName: application.first_name || "",
    middleName: application.middle_name || "",
    phone: application.phone || "",
    passportNumber: application.passport_number || "",
    vehicleType: application.vehicle_type || "light_car",
    brand: application.brand || "",
    model: application.model || "",
    plateNumber: application.plate_number || "",
    year: application.year || "",
    color: application.color || "",
    seats: application.seats ?? 4,
    cargoKg: application.cargo_kg ?? 100,
    cargoM3: application.cargo_m3 ?? null,
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
    vehicle_type: formData.vehicleType || null,
    brand: formData.brand || null,
    model: formData.model || null,
    plate_number: formData.plateNumber || null,
    year: formData.year ? Number(formData.year) : null,
    color: formData.color || null,
    seats: formData.seats ? Number(formData.seats) : null,
    cargo_kg: formData.cargoKg ? Number(formData.cargoKg) : null,
    cargo_m3: formData.cargoM3 ? Number(formData.cargoM3) : null,
    updated_at: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
  };
  const existing = await getMyDriverApplicationWithDocuments();
  if (existing.application?.id) {
    const { data, error } = await supabase.from("driver_applications").update(payload).eq("id", existing.application.id).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  }
  const { data, error } = await supabase.from("driver_applications").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function uploadDriverDocuments(applicationId, files = {}) {
  const user = await getAuthenticatedUser();
  const { data: existingRows, error: existingRowsError } = await supabase.from("driver_documents").select("*").eq("application_id", applicationId);
  if (existingRowsError) throw new Error(existingRowsError.message);
  const existingMap = (existingRows || []).reduce((acc, row) => { acc[row.doc_type] = row; return acc; }, {});
  for (const field of DRIVER_DOCUMENT_FIELDS) {
    const file = files[field.key];
    if (!file) continue;
    const ext = getFileExtension(file);
    const path = `${sanitizeSegment(user.id)}/${sanitizeSegment(applicationId)}/${sanitizeSegment(field.docType)}_${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, file, { cacheControl: "3600", upsert: true });
    if (uploadError) throw new Error(uploadError.message);
    const { data: publicUrlData } = supabase.storage.from(DOCUMENT_BUCKET).getPublicUrl(path);
    const payload = {
      application_id: applicationId,
      user_id: user.id,
      doc_type: field.docType,
      file_path: path,
      file_url: publicUrlData?.publicUrl || "",
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      updated_at: new Date().toISOString(),
    };
    const existing = existingMap[field.docType];
    if (existing?.id) {
      const { error } = await supabase.from("driver_documents").update(payload).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("driver_documents").insert({ ...payload, created_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
    }
  }
}

export async function submitDriverApplication(formData, files = {}) {
  const application = await upsertDriverApplication(formData);
  await uploadDriverDocuments(application.id, files);
  return getMyDriverApplicationWithDocuments();
}

export { DRIVER_DOCUMENT_FIELD_MAP };
