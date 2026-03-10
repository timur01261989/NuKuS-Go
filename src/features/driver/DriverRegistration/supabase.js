import { supabase } from "@/lib/supabase";
import { DRIVER_DOCUMENT_FIELDS, DRIVER_DOCUMENT_FIELD_MAP } from "./uploadConfig";

const DOCUMENT_BUCKET = "driver-documents";

function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

function getFileExtension(file) {
  const name = String(file?.name || "");
  if (name.includes(".")) {
    const ext = String(name.split(".").pop() || "").toLowerCase();
    if (ext) return ext;
  }

  const type = String(file?.type || "").toLowerCase();
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  return "jpg";
}

function buildDocumentRowMap(rows = []) {
  return rows.reduce((acc, row) => {
    if (row?.doc_type) {
      acc[row.doc_type] = row;
    }
    return acc;
  }, {});
}

export async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message || "Foydalanuvchini olishda xato");
  }

  if (!user) {
    throw new Error("Login qilinmagan");
  }

  return user;
}

export async function getMyDriverApplicationWithDocuments() {
  const user = await getAuthenticatedUser();

  const { data: application, error: applicationError } = await supabase
    .from("driver_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (applicationError) {
    throw new Error(applicationError.message || "Arizani olishda xato");
  }

  if (!application) {
    return {
      application: null,
      documents: [],
    };
  }

  const { data: documents, error: documentsError } = await supabase
    .from("driver_documents")
    .select("*")
    .eq("application_id", application.id)
    .order("created_at", { ascending: true });

  if (documentsError) {
    throw new Error(documentsError.message || "Hujjatlarni olishda xato");
  }

  return {
    application,
    documents: documents || [],
  };
}

export function buildFormDataFromApplication(application) {
  if (!application) {
    return null;
  }

  return {
    lastName: application.last_name || "",
    firstName: application.first_name || "",
    middleName: application.middle_name || "",
    phone: application.phone || "",
    passportNumber: application.passport_number || "",

    vehicleType: application.transport_type || "light_car",
    brand: application.vehicle_brand || "",
    model: application.vehicle_model || "",
    plateNumber: application.vehicle_plate || "",
    year: application.vehicle_year ?? "",
    color: application.vehicle_color || "",
    seats: application.seat_count ?? 4,
    cargoKg: application.requested_max_freight_weight_kg ?? "",
    cargoM3: application.requested_payload_volume_m3 ?? "",

    status: application.status || "pending",
    rejectionReason: application.rejection_reason || "",
    adminNote: application.admin_note || "",
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
    requested_max_freight_weight_kg: formData.cargoKg
      ? Number(formData.cargoKg)
      : null,
    requested_payload_volume_m3: formData.cargoM3
      ? Number(formData.cargoM3)
      : null,

    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existing = await getMyDriverApplicationWithDocuments();
  if (existing.application?.id) {
    const { data, error } = await supabase
      .from("driver_applications")
      .update(payload)
      .eq("id", existing.application.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message || "Arizani yangilashda xato");
    }

    return data;
  }

  const { data, error } = await supabase
    .from("driver_applications")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Arizani yaratishda xato");
  }

  return data;
}

export async function uploadDriverDocuments(applicationId, files = {}) {
  const user = await getAuthenticatedUser();

  const { data: existingRows, error: existingRowsError } = await supabase
    .from("driver_documents")
    .select("*")
    .eq("application_id", applicationId);

  if (existingRowsError) {
    throw new Error(existingRowsError.message || "Eski hujjatlarni olishda xato");
  }

  const existingMap = buildDocumentRowMap(existingRows || []);

  for (const field of DRIVER_DOCUMENT_FIELDS) {
    const file = files[field.key];
    if (!file) continue;

    const extension = getFileExtension(file);
    const path = ${sanitizeSegment(user.id)}/${sanitizeSegment(
      applicationId
    )}/${sanitizeSegment(field.docType)}_${Date.now()}.${extension};

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message || ${field.label} ni yuklashda xato);
    }

    const { data: publicUrlData } = supabase.storage
      .from(DOCUMENT_BUCKET)
      .getPublicUrl(path);

    const payload = {
      application_id: applicationId,
      user_id: user.id,
      doc_type: field.docType,
      file_path: path,
      file_url: publicUrlData?.publicUrl || "",
      file_name: file.name || ${field.docType}.${extension},
      file_size: file.size || 0,
      mime_type: file.type || "image/jpeg",
      updated_at: new Date().toISOString(),
    };

    const existing = existingMap[field.docType];

    if (existing?.id) {
      const { error } = await supabase
        .from("driver_documents")
        .update(payload)
        .eq("id", existing.id);

      if (error) {
        throw new Error(error.message || ${field.label} ni yangilashda xato);
      }
    } else {
      const { error } = await supabase.from("driver_documents").insert({
        ...payload,
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(error.message || ${field.label} ni saqlashda xato);
      }
    }
  }
}

export async function submitDriverApplication(formData, files = {}) {
  const application = await upsertDriverApplication(formData);
  await uploadDriverDocuments(application.id, files);
  return getMyDriverApplicationWithDocuments();
}

export function mapExistingDocumentsToForm(records = []) {
  const byDocType = buildDocumentRowMap(records);

  return Object.values(DRIVER_DOCUMENT_FIELD_MAP).reduce((acc, field) => {
    const row = byDocType[field.docType];
    if (row) {
      acc[field.key] = row;
    }
    return acc;
  }, {});
}

export { DRIVER_DOCUMENT_FIELD_MAP };