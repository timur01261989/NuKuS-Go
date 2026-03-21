import { supabase } from "@/services/supabase/supabaseClient";
import {
  DRIVER_DOCUMENT_FIELDS,
  DRIVER_DOCUMENT_FIELD_MAP,
  getDefaultServiceTypes,
  toLegacyTransportType,
} from "./uploadConfig";

const DOCUMENT_BUCKET = "driver-documents";

export { DRIVER_DOCUMENT_FIELD_MAP };

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

function buildFallbackFileName(docType, extension) {
  return `${sanitizeSegment(docType)}_${Date.now()}.${extension}`;
}

function toNullableInt(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function toNullableFloat(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildDocumentRowMap(rows = []) {
  return (rows || []).reduce((acc, row) => {
    if (row?.doc_type) {
      acc[row.doc_type] = row;
    }
    return acc;
  }, {});
}

function normalizeServiceTypes(rawValue, fallbackVehicleType = "light_car") {
  if (!rawValue) return getDefaultServiceTypes(fallbackVehicleType);

  if (typeof rawValue === "string") {
    try {
      return normalizeServiceTypes(JSON.parse(rawValue), fallbackVehicleType);
    } catch (_error) {
      return getDefaultServiceTypes(fallbackVehicleType);
    }
  }

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

function isMissingColumnError(error) {
  const text = String(error?.message || error?.details || "").toLowerCase();
  return text.includes("column") && text.includes("does not exist");
}

function buildApplicationPayload(formData) {
  const vehicleType = formData.vehicleType || "light_car";
  const serviceTypes = normalizeServiceTypes(formData.serviceTypes, vehicleType);

  return {
    last_name: String(formData.lastName || "").toUpperCase().trim() || null,
    first_name: String(formData.firstName || "").toUpperCase().trim() || null,
    middle_name: String(formData.middleName || "").toUpperCase().trim() || null,
    // FIX: father_name avval formData.middleName ga noto'g'ri bog'langan edi (duplicate bug).
    // father_name — otasining ismi (patronimik). middleName bilan bir xil maydon emas.
    // Forma fatherName maydonini qo'llasa o'shandan oladi, aks holda middle_name fallback.
    father_name: String(formData.fatherName || formData.middleName || "").toUpperCase().trim() || null,
    phone: String(formData.phone || "").replace(/\D/g, "") || null,
    passport_number:
      String(formData.passportNumber || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "") || null,
    requested_vehicle_type: vehicleType,
    requested_service_types: serviceTypes,
    transport_type: toLegacyTransportType(vehicleType),
    vehicle_brand: formData.brand || null,
    vehicle_model: formData.model || null,
    vehicle_plate:
      String(formData.plateNumber || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "") || null,
    vehicle_year: toNullableInt(formData.year),
    vehicle_color: formData.color || null,
    seat_count: toNullableInt(formData.seats),
    requested_max_freight_weight_kg: toNullableFloat(formData.cargoKg),
    requested_payload_volume_m3: toNullableFloat(formData.cargoM3),
  };
}

function stripExtendedColumns(payload) {
  const { requested_vehicle_type, requested_service_types, ...legacyPayload } = payload;
  return legacyPayload;
}

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

export async function getMyDriverApplicationWithDocuments() {
  const user = await getAuthenticatedUser();

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

  const { data: documents, error: docsError } = await supabase
    .from("driver_documents")
    .select("*")
    .eq("application_id", application.id)
    .eq("user_id", user.id)
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

export function buildFormDataFromApplication(application) {
  if (!application) {
    return {};
  }

  const vehicleType = application.requested_vehicle_type || application.transport_type || "light_car";
  const serviceTypes = normalizeServiceTypes(application.requested_service_types, vehicleType);

  return {
    lastName: application.last_name || "",
    firstName: application.first_name || "",
    middleName: application.middle_name || application.father_name || "",
    phone: String(application.phone || "").replace(/\D/g, ""),
    passportNumber: application.passport_number || "",
    vehicleType,
    brand: application.vehicle_brand || "",
    model: application.vehicle_model || "",
    plateNumber: application.vehicle_plate || "",
    year: application.vehicle_year ?? "",
    color: application.vehicle_color || "",
    seats: application.seat_count ?? 0,
    cargoKg: application.requested_max_freight_weight_kg ?? 0,
    cargoM3: application.requested_payload_volume_m3 ?? 0,
    serviceTypes,
    status: application.status || "pending",
    rejectionReason: application.rejection_reason || "",
    adminNote: application.admin_note || "",
  };
}

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

  async function executeWithFallback(operation) {
    let result = await operation(payload);
    if (result.error && isMissingColumnError(result.error)) {
      result = await operation(stripExtendedColumns(payload));
    }
    return result;
  }

  if (existingApp?.id) {
    const { data, error } = await executeWithFallback((nextPayload) =>
      supabase
        .from("driver_applications")
        .update(nextPayload)
        .eq("id", existingApp.id)
        .select()
        .single()
    );

    if (error) throw new Error(`Arizani yangilashda xato: ${error.message}`);
    return data;
  }

  const { data, error } = await executeWithFallback((nextPayload) =>
    supabase
      .from("driver_applications")
      .insert({
        ...nextPayload,
        created_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()
  );

  if (error) throw new Error(`Arizani saqlashda xato: ${error.message}`);
  return data;
}

export async function uploadDriverDocuments(applicationId, files = {}) {
  const user = await getAuthenticatedUser();

  const { data: ownedApplication, error: ownedApplicationError } = await supabase
    .from("driver_applications")
    .select("id,user_id")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownedApplicationError) {
    throw new Error(`Ariza egasini tekshirishda xato: ${ownedApplicationError.message}`);
  }

  if (!ownedApplication?.id) {
    throw new Error("Bu ariza sizga tegishli emas yoki topilmadi");
  }

  const { data: existingDocs, error: existingDocsError } = await supabase
    .from("driver_documents")
    .select("*")
    .eq("application_id", applicationId)
    .eq("user_id", user.id);

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

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`${field.label} yuklashda xato: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(DOCUMENT_BUCKET)
      .getPublicUrl(path);

    const safeFileName =
      file?.name && String(file.name).trim()
        ? file.name
        : buildFallbackFileName(field.docType, extension);

    const documentPayload = {
      application_id: applicationId,
      user_id: user.id,
      doc_type: field.docType,
      file_path: path,
      file_url: publicUrlData?.publicUrl || "",
      file_name: safeFileName,
      file_size: file.size || 0,
      mime_type: file.type || "image/jpeg",
      updated_at: new Date().toISOString(),
    };

    const existing = existingMap[field.docType];

    if (existing?.id) {
      const { error } = await supabase
        .from("driver_documents")
        .update(documentPayload)
        .eq("id", existing.id);

      if (error) throw new Error(`${field.label} yangilanishda xato: ${error.message}`);
    } else {
      const { error } = await supabase
        .from("driver_documents")
        .insert({
          ...documentPayload,
          created_at: new Date().toISOString(),
        });

      if (error) throw new Error(`${field.label} saqlashda xato: ${error.message}`);
    }
  }

  const { data: freshDocuments, error: freshError } = await supabase
    .from("driver_documents")
    .select("*")
    .eq("application_id", applicationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (freshError) {
    throw new Error(`Yangi hujjatlarni olishda xato: ${freshError.message}`);
  }

  return freshDocuments || [];
}

export async function submitDriverApplication(formData, files = {}) {
  const application = await upsertDriverApplication(formData);
  const documents = await uploadDriverDocuments(application.id, files);
  return { application, documents };
}
