import { supabase } from "@/lib/supabase";
import { DRIVER_DOCUMENT_FIELDS, DRIVER_DOCUMENT_FIELD_MAP } from "./uploadConfig";

/**
 * Storage Bucket nomi
 */
const DOCUMENT_BUCKET = "driver-documents";

/**
 * DriverRegister.jsx ushbu mapni shu fayldan import qiladi.
 * Shuning uchun uni qayta eksport qilish shart.
 */
export { DRIVER_DOCUMENT_FIELD_MAP };

/**
 * Fayl yo'llari uchun xavfsiz segmentlar yaratish.
 */
function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Fayl kengaytmasini aniqlash (Fallback bilan).
 */
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

/**
 * Hujjatlarni doc_type bo'yicha Map ko'rinishiga o'tkazish.
 */
function buildDocumentRowMap(rows = []) {
  return (rows || []).reduce((acc, row) => {
    if (row?.doc_type) {
      acc[row.doc_type] = row;
    }
    return acc;
  }, {});
}

/**
 * Autentifikatsiyadan o'tgan foydalanuvchini olish.
 */
export async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message || "Foydalanuvchi ma'lumotlarini olishda xato");
  }

  if (!user) {
    throw new Error("Siz tizimga kirmagansiz. Iltimos, qayta kiring.");
  }

  return user;
}

/**
 * Haydovchining arizasi va barcha hujjatlarini yuklash.
 */
export async function getMyDriverApplicationWithDocuments() {
  const user = await getAuthenticatedUser();

  // 1. Arizani olish
  const { data: application, error: appError } = await supabase
    .from("driver_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (appError) {
    console.error("Application error:", appError);
    throw new Error(appError.message);
  }

  if (!application) {
    return { application: null, documents: [] };
  }

  // 2. Hujjatlarni olish
  const { data: documents, error: docsError } = await supabase
    .from("driver_documents")
    .select("*")
    .eq("application_id", application.id)
    .order("created_at", { ascending: true });

  if (docsError) {
    console.error("Documents error:", docsError);
    throw new Error(docsError.message);
  }

  return {
    application,
    documents: documents || [],
  };
}

/**
 * Bazadagi application obyektini form uchun mos ko'rinishga o'tkazish.
 * DriverRegister.jsx bootstrap vaqtida aynan shu funksiyani ishlatadi.
 */
export function buildFormDataFromApplication(application) {
  if (!application) {
    return {};
  }

  return {
    lastName: application.last_name || "",
    firstName: application.first_name || "",
    middleName: application.middle_name || "",
    phone: String(application.phone || "").replace(/\D/g, ""),
    passportNumber: application.passport_number || "",

    vehicleType: application.transport_type || "light_car",
    brand: application.vehicle_brand || "",
    model: application.vehicle_model || "",
    plateNumber: application.vehicle_plate || "",
    year: application.vehicle_year ?? "",
    color: application.vehicle_color || "",
    seats: application.seat_count ?? 0,
    cargoKg: application.requested_max_freight_weight_kg ?? 0,
    cargoM3: application.requested_payload_volume_m3 ?? 0,

    status: application.status || "pending",
    rejectionReason: application.rejection_reason || "",
    adminNote: application.admin_note || "",
  };
}

/**
 * Formadan kelgan ma'lumotlarni bazaga mos payload ko'rinishiga o'tkazish.
 * MUHIM: schema nomlari driver_applications jadvalidagi real ustunlarga mos.
 */
function buildApplicationPayload(formData) {
  return {
    last_name: String(formData.lastName || "").toUpperCase().trim() || null,
    first_name: String(formData.firstName || "").toUpperCase().trim() || null,
    middle_name: String(formData.middleName || "").toUpperCase().trim() || null,
    phone: String(formData.phone || "").replace(/\D/g, "") || null,
    passport_number:
      String(formData.passportNumber || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "") || null,

    transport_type: formData.vehicleType || null,
    vehicle_brand: formData.brand || null,
    vehicle_model: formData.model || null,
    vehicle_plate:
      String(formData.plateNumber || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "") || null,
    vehicle_year: formData.year ? parseInt(formData.year, 10) : null,
    vehicle_color: formData.color || null,
    seat_count: formData.seats ? parseInt(formData.seats, 10) : 0,

    requested_max_freight_weight_kg: formData.cargoKg
      ? parseFloat(formData.cargoKg)
      : 0,
    requested_payload_volume_m3: formData.cargoM3
      ? parseFloat(formData.cargoM3)
      : 0,
  };
}

/**
 * Arizani saqlash yoki yangilash (Upsert).
 */
export async function upsertDriverApplication(formData) {
  const user = await getAuthenticatedUser();
  const baseData = buildApplicationPayload(formData);

  const payload = {
    ...baseData,
    user_id: user.id,
    status: "pending",
    updated_at: new Date().toISOString(),
  };

  const { data: existingApp, error: existingError } = await supabase
    .from("driver_applications")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Mavjud arizani tekshirishda xato: ${existingError.message}`);
  }

  if (existingApp?.id) {
    const { data, error } = await supabase
      .from("driver_applications")
      .update(payload)
      .eq("id", existingApp.id)
      .select()
      .single();

    if (error) throw new Error(`Arizani yangilashda xato: ${error.message}`);
    return data;
  } else {
    const { data, error } = await supabase
      .from("driver_applications")
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Arizani saqlashda xato: ${error.message}`);
    return data;
  }
}

/**
 * Hujjatlarni yuklash jarayoni.
 */
export async function uploadDriverDocuments(applicationId, files = {}) {
  const user = await getAuthenticatedUser();

  const { data: existingDocs, error: existingDocsError } = await supabase
    .from("driver_documents")
    .select("*")
    .eq("application_id", applicationId);

  if (existingDocsError) {
    throw new Error(`Mavjud hujjatlarni olishda xato: ${existingDocsError.message}`);
  }

  const existingMap = buildDocumentRowMap(existingDocs || []);

  for (const field of DRIVER_DOCUMENT_FIELDS) {
    const file = files[field.key];
    if (!file) continue;

    const extension = getFileExtension(file);
    const timestamp = Date.now();
    const path = `${sanitizeSegment(user.id)}/${sanitizeSegment(applicationId)}/${sanitizeSegment(field.docType)}_${timestamp}.${extension}`;

    // 1. Faylni Storage ga yuklash
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`${field.label} yuklashda xato: ${uploadError.message}`);
    }

    // 2. Public URL olish
    const { data: publicUrlData } = supabase.storage
      .from(DOCUMENT_BUCKET)
      .getPublicUrl(path);

    const documentPayload = {
      application_id: applicationId,
      user_id: user.id,
      doc_type: field.docType,
      file_path: path,
      file_url: publicUrlData?.publicUrl || "",
      file_name: file.name || `${field.docType}.${extension}`,
      file_size: file.size || 0,
      mime_type: file.type || "image/jpeg",
      updated_at: new Date().toISOString(),
    };

    const existing = existingMap[field.docType];

    if (existing?.id) {
      // Mavjud hujjatni yangilash
      const { error } = await supabase
        .from("driver_documents")
        .update(documentPayload)
        .eq("id", existing.id);

      if (error) throw new Error(`${field.label} yangilanishda xato: ${error.message}`);
    } else {
      // Yangi hujjat qo'shish
      const { error } = await supabase
        .from("driver_documents")
        .insert({
          ...documentPayload,
          created_at: new Date().toISOString(),
        });

      if (error) throw new Error(`${field.label} saqlanishda xato: ${error.message}`);
    }
  }
}

/**
 * Umumiy ariza topshirish mantiqi.
 */
export async function submitDriverApplication(formData, files = {}) {
  try {
    const application = await upsertDriverApplication(formData);

    if (Object.keys(files).length > 0) {
      await uploadDriverDocuments(application.id, files);
    }

    return await getMyDriverApplicationWithDocuments();
  } catch (error) {
    console.error("submitDriverApplication Error:", error);
    throw error;
  }
}

/**
 * Bazadagi ma'lumotlarni Ant Design Upload formatiga o'tkazish.
 */
export function mapExistingDocumentsToForm(records = []) {
  if (!records || records.length === 0) return {};

  const byDocType = buildDocumentRowMap(records);

  return Object.values(DRIVER_DOCUMENT_FIELD_MAP).reduce((acc, field) => {
    const record = byDocType[field.docType];
    if (record) {
      acc[field.key] = {
        uid: record.id,
        name: record.file_name,
        status: "done",
        url: record.file_url,
        docType: record.doc_type,
      };
    }
    return acc;
  }, {});
}
