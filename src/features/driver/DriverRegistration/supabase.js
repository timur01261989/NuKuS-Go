import { supabase } from "@/lib/supabase";
import { DRIVER_DOCUMENT_FIELDS } from "./uploadConfig";

/**
 * BUCKET NAME - Supabase Storage dagi papka nomi
 */
const DOCUMENT_BUCKET = "driver-documents";

/**
 * DRIVER_DOCUMENT_FIELD_MAP - DriverRegister.jsx tomonidan kutilayotgan mapping.
 * Bu ob'ekt UI dagi keylarni (passportFront) bazadagi doc_type (passport_front) bilan bog'laydi.
 */
export const DRIVER_DOCUMENT_FIELD_MAP = DRIVER_DOCUMENT_FIELDS.reduce((acc, field) => {
  acc[field.key] = {
    key: field.key,
    docType: field.docType,
    label: field.label,
    required: field.required
  };
  return acc;
}, {});

/**
 * Xavfsiz fayl yo'li (path) yaratish uchun segmentlarni tozalash.
 * Bo'shliqlar va maxsus belgilarni pastki chiziqqa almashtiradi.
 */
function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Fayl kengaytmasini aniqlash. 
 * Agar fayl nomi bo'lmasa, mime-type dan kelib chiqib fallback beradi.
 */
function getFileExtension(file) {
  if (!file) return "jpg";
  const name = String(file.name || "");
  if (name.includes(".")) {
    const ext = String(name.split(".").pop() || "").toLowerCase();
    if (ext) return ext;
  }
  const type = String(file.type || "").toLowerCase();
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  return "jpg";
}

/**
 * Hujjatlar ro'yxatini doc_type bo'yicha Map ko'rinishiga o'tkazish.
 * Bu bazadan kelgan ma'lumotni tezkor qidirish uchun kerak.
 */
function buildDocumentRowMap(rows = []) {
  return (rows || []).reduce((acc, row) => {
    if (row && row.doc_type) {
      acc[row.doc_type] = row;
    }
    return acc;
  }, {});
}

/**
 * Foydalanuvchi sessiyasini tekshirish.
 * Agar login qilinmagan bo'lsa, xato qaytaradi.
 */
export async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Autentifikatsiya xatosi: ${error.message}`);
  }

  if (!user) {
    throw new Error("Siz tizimga kirmagansiz. Iltimos, profilga kiring.");
  }

  return user;
}

/**
 * Haydovchining arizasi va barcha yuklangan hujjatlarini bazadan yuklab olish.
 * DriverRegister sahifasi yuklanganda ishlatiladi.
 */
export async function getMyDriverApplicationWithDocuments() {
  const user = await getAuthenticatedUser();

  // 1. Arizani user_id orqali qidirish
  const { data: application, error: appError } = await supabase
    .from("driver_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (appError) {
    console.error("Application loading error:", appError);
    throw new Error(appError.message);
  }

  if (!application) {
    return { application: null, documents: [] };
  }

  // 2. Arizaga tegishli barcha hujjatlarni olish
  const { data: documents, error: docsError } = await supabase
    .from("driver_documents")
    .select("*")
    .eq("application_id", application.id)
    .order("created_at", { ascending: true });

  if (docsError) {
    console.error("Documents loading error:", docsError);
    throw new Error(docsError.message);
  }

  return { application, documents };
}

/**
 * Formadagi camelCase ma'lumotlarni bazadagi snake_case ustunlarga o'tkazish.
 * Ma'lumotlarni tozalash (trim) va formatlash (uppercase) shu yerda bajariladi.
 */
export function buildFormDataFromApplication(formData) {
  if (!formData) return {};

  return {
    last_name: String(formData.lastName || "").toUpperCase().trim(),
    first_name: String(formData.firstName || "").toUpperCase().trim(),
    middle_name: String(formData.middleName || "").toUpperCase().trim(),
    phone: String(formData.phone || "").replace(/\D/g, ""),
    passport_number: String(formData.passportNumber || "").toUpperCase().replace(/[^A-Z0-9]/g, ""),
    vehicle_type: formData.vehicleType,
    brand: formData.brand,
    model: formData.model,
    plate_number: String(formData.plateNumber || "").toUpperCase().replace(/[^A-Z0-9]/g, ""),
    year: parseInt(formData.year) || null,
    color: formData.color,
    seats: parseInt(formData.seats) || 0,
    cargo_kg: parseFloat(formData.cargoKg) || 0,
    cargo_m3: parseFloat(formData.cargoM3) || 0,
  };
}

/**
 * Arizani Upsert qilish (bor bo'lsa yangilash, yo'q bo'lsa yaratish).
 */
export async function upsertDriverApplication(formData) {
  const user = await getAuthenticatedUser();
  const baseData = buildFormDataFromApplication(formData);

  const payload = {
    ...baseData,
    user_id: user.id,
    status: "pending",
    updated_at: new Date().toISOString(),
  };

  const { data: existingApp } = await supabase
    .from("driver_applications")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

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
      })
      .select()
      .single();

    if (error) throw new Error(`Arizani saqlashda xato: ${error.message}`);
    return data;
  }
}

/**
 * Fayllarni Storage ga yuklash va driver_documents jadvaliga yozish.
 * Har bir fayl uchun alohida path generatsiya qilinadi.
 */
export async function uploadDriverDocuments(applicationId, files = {}) {
  const user = await getAuthenticatedUser();

  // 1. Bazadagi mavjud hujjatlarni olamiz (Duplicate bo'lmasligi uchun)
  const { data: existingDocs } = await supabase
    .from("driver_documents")
    .select("*")
    .eq("application_id", applicationId);

  const existingMap = buildDocumentRowMap(existingDocs || []);

  // 2. Har bir konfiguratsiya qilingan maydon bo'yicha sikl
  for (const field of DRIVER_DOCUMENT_FIELDS) {
    const file = files[field.key];
    if (!file) continue;

    const extension = getFileExtension(file);
    const timestamp = Date.now();
    
    // BACKTICKS ( ` ) - MUHIM! Template literal xatosi to'liq tuzatildi.
    const path = `${sanitizeSegment(user.id)}/${sanitizeSegment(applicationId)}/${sanitizeSegment(field.docType)}_${timestamp}.${extension}`;

    // Storage ga yuklash
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`${field.label} faylini yuklashda xato: ${uploadError.message}`);
    }

    // Public URL olish
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

    const existingRecord = existingMap[field.docType];

    if (existingRecord?.id) {
      // Mavjud hujjatni yangilash
      const { error: updateError } = await supabase
        .from("driver_documents")
        .update(documentPayload)
        .eq("id", existingRecord.id);

      if (updateError) throw new Error(`${field.label} bazada yangilanmadi: ${updateError.message}`);
    } else {
      // Yangi hujjat kiritish
      const { error: insertError } = await supabase
        .from("driver_documents")
        .insert({
          ...documentPayload,
          created_at: new Date().toISOString(),
        });

      if (insertError) throw new Error(`${field.label} bazaga saqlanmadi: ${insertError.message}`);
    }
  }
}

/**
 * ARIZANI TOPSHIRISH (ASOSIY ENTRY POINT)
 * Barcha bosqichlarni ketma-ket bajaradi.
 */
export async function submitDriverApplication(formData, files = {}) {
  try {
    // 1. Textual ma'lumotlarni saqlash
    const application = await upsertDriverApplication(formData);

    // 2. Agar fayllar bo'lsa, ularni yuklash
    if (Object.keys(files).length > 0) {
      await uploadDriverDocuments(application.id, files);
    }

    // 3. Yakuniy holatni bazadan qayta o'qib qaytarish
    return await getMyDriverApplicationWithDocuments();
  } catch (error) {
    console.error("submitDriverApplication Error:", error);
    throw error;
  }
}

/**
 * Bazadan kelgan hujjatlarni Ant Design Upload komponenti formatiga o'tkazish.
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