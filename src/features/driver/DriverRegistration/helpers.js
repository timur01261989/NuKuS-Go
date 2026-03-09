import { storageFolderMap } from "./uploadConfig";

export function onlyDigits(value = "") {
  return String(value).replace(/\D+/g, "");
}

export function normalizePhoneInput(value = "") {
  return onlyDigits(value).slice(0, 9);
}

export function normalizePassportNumber(value = "") {
  const cleaned = String(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const letters = cleaned.slice(0, 2).replace(/[^A-Z]/g, "");
  const digits = cleaned.slice(2).replace(/\D/g, "").slice(0, 7);
  return `${letters}${digits}`;
}

export function normalizePlateNumber(value = "") {
  return String(value).toUpperCase().replace(/[^A-Z0-9\s-]/g, "").slice(0, 12);
}

export function normalizeYear(value = "") {
  return onlyDigits(value).slice(0, 4);
}

export function toIntegerString(value = "", maxLen = 4) {
  return onlyDigits(value).slice(0, maxLen);
}

export function fileToPreview(file) {
  if (!file) return null;
  try {
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

export function revokePreview(previewUrl) {
  if (!previewUrl) return;
  try {
    URL.revokeObjectURL(previewUrl);
  } catch {}
}

export function readableFileSize(size = 0) {
  if (!size) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export function createStoragePath(userId, fieldKey, fileName = "file") {
  const folder = storageFolderMap[fieldKey] || fieldKey;
  const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const stamp = Date.now();
  return `${userId}/${folder}/${stamp}_${safeName}`;
}

export function buildApplicationPayload(formData, uploadedFilesMap = {}, userId = null) {
  return {
    user_id: userId,
    last_name: formData.lastName?.trim() || null,
    first_name: formData.firstName?.trim() || null,
    middle_name: formData.middleName?.trim() || null,
    phone: formData.phone ? `+998${formData.phone}` : null,
    passport_number: formData.passportNumber?.trim() || null,
    vehicle_type: formData.vehicleType || null,
    brand: formData.brand?.trim() || null,
    model: formData.model?.trim() || null,
    plate_number: formData.plateNumber?.trim() || null,
    year: formData.year ? Number(formData.year) : null,
    color: formData.color?.trim() || null,
    seats: formData.seats ? Number(formData.seats) : null,
    cargo_kg: formData.cargoKg ? Number(formData.cargoKg) : null,
    cargo_m3: formData.cargoM3 ? Number(formData.cargoM3) : null,
    notes: formData.notes?.trim() || null,
    documents: uploadedFilesMap,
    status: "pending",
  };
}

export async function uploadSingleFile({ supabase, bucket, userId, fieldKey, file }) {
  if (!supabase || !bucket || !userId || !fieldKey || !file) return null;
  const path = createStoragePath(userId, fieldKey, file.name || fieldKey);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return {
    path,
    publicUrl: data?.publicUrl || null,
    name: file.name || null,
    size: file.size || null,
    type: file.type || null,
  };
}
