import { supabase } from "@/lib/supabase";
import { DRIVER_DOCUMENT_FIELDS, DRIVER_DOCUMENT_FIELD_MAP } from "./uploadConfig";

const DOCUMENT_BUCKET = "driver-documents";

/**
 * Storage uchun xavfsiz papka nomlarini yaratish
 */
function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Fayl kengaytmasini aniqlash (fallback bilan)
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
 * Hujjatlar massivini doc_type bo'yicha Map ko'rinishiga o'tkazish
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
 * Joriy autentifikatsiyadan o'tgan foydalanuvchini olish
 */
export async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Avtorizatsiya xatosi: ${error.message}`);
  }

  if (!user) {
    throw new Error("Tizimga kirilmagan. Iltimos, qayta kiring.");
  }

  return user;
}

/**
 * Haydovchining arizasi va barcha hujjatlarini birgalikda olish
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
    console.error("Ariza yuklashda xato:", appError);
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
    console.error("Hujjatlarni yuklashda xato:", docsError);
    throw new Error(docsError.message);
  }

  return { application, documents };
}

/**
 * Formadagi ma'lumotlarni bazaga moslab (formatting) tayyorlash
 */
export function buildFormDataFromApplication(formData) {
  if (!formData) return {};

  return {
    // Ism-familiya har doim KATTA HARFLARDA
    last_name: String(formData.lastName || "").toUpperCase().trim(),
    first_name: String(formData.firstName || "").toUpperCase().trim(),
    middle_name: String(formData.middleName || "").toUpperCase().trim(),
    
    // Telefon va raqamli maydonlar faqat raqamlar
    phone: String(formData.phone || "").replace(/\D/g, ""),
    passport_number: String(formData.passportNumber || "").toUpperCase().replace(/[^A-Z0-9]/g, ""),
    
    // Avtomobil ma'lumotlari
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
 * Arizani yaratish yoki yangilash (Upsert)
 */
export async function upsertDriverApplication(formData) {
  const user = await getAuthenticatedUser();
  const baseData = buildFormDataFromApplication(formData);

  const payload = {
    ...baseData,
    user_id: user.id,
    status: "pending", // Har safar yangilanganda status pendingga qaytadi
    updated_at: new Date().toISOString(),
  };

  // Oldin ariza borligini tekshirish
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
 * Hujjatlarni Storage ga yuklash va DB dagi jadvalni sinxronlash
 */
export async function uploadDriverDocuments(applicationId, files = {}) {
  const user = await getAuthenticatedUser();

  // Mavjud hujjatlarni olish (qayta yuklamaslik yoki almashtirish uchun)
  const { data: existingDocs } = await supabase
    .from("driver_documents")
    .select("*")
    .eq("application_id", applicationId);

  const existingMap = buildDocumentRowMap(existingDocs || []);

  for (const field of DRIVER_DOCUMENT_FIELDS) {
    const file = files[field.key];
    if (!file) continue; // Agar rasm tanlanmagan bo'lsa, o'tkazib yuboramiz

    const extension = getFileExtension(file);
    const timestamp = Date.now();
    
    // TEMPLATE LITERAL (Backticks) TO'G'IRLANDI
    const path = `${sanitizeSegment(user.id)}/${sanitizeSegment(applicationId)}/${sanitizeSegment(field.docType)}_${timestamp}.${extension}`;

    // 1. Storage ga yuklash
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`${field.label} faylini yuklashda xato: ${uploadError.message}`);
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

    const existingRecord = existingMap[field.docType];

    if (existingRecord?.id) {
      // Yangilash
      const { error: updateError } = await supabase
        .from("driver_documents")
        .update(documentPayload)
        .eq("id", existingRecord.id);

      if (updateError) throw new Error(`${field.label} ma'lumotini yangilashda xato: ${updateError.message}`);
    } else {
      // Yangi qo'shish
      const { error: insertError } = await supabase
        .from("driver_documents")
        .insert({
          ...documentPayload,
          created_at: new Date().toISOString(),
        });

      if (insertError) throw new Error(`${field.label} ma'lumotini saqlashda xato: ${insertError.message}`);
    }
  }
}

/**
 * To'liq ariza topshirish jarayoni (Asosiy funksiya)
 */
export async function submitDriverApplication(formData, files = {}) {
  try {
    // 1. Arizani (tekstual ma'lumotlar) saqlash
    const application = await upsertDriverApplication(formData);

    // 2. Hujjatlarni (fayllar) Storage va DB ga yuklash
    if (Object.keys(files).length > 0) {
      await uploadDriverDocuments(application.id, files);
    }

    // 3. Yangilangan holatni qaytarish
    return await getMyDriverApplicationWithDocuments();
  } catch (error) {
    console.error("submitDriverApplication ichida xato:", error);
    throw error;
  }
}

/**
 * Mavjud hujjatlarni forma uchun map qilish
 */
export function mapExistingDocumentsToForm(records = []) {
  if (!records || records.length === 0) return {};
  
  const byDocType = buildDocumentRowMap(records);

  return Object.values(DRIVER_DOCUMENT_FIELD_MAP || {}).reduce((acc, field) => {
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