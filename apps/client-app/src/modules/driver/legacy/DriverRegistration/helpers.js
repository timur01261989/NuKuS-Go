import { compressImageToFile } from "@/modules/shared/utils/imageUtils.js";

export function digitsOnly(value = "") {
  return String(value).replace(/\D/g, "");
}

export function normalizePhone(value = "") {
  return digitsOnly(value).slice(0, 9);
}

export function normalizeName(value = "") {
  // Faqat harflar va bo'shliqlarni qoldiradi, barchasini KATTA HARFGA o'tkazadi (O'zbek harflari ham qo'llab-quvvatlanadi)
  return String(value)
    .toUpperCase()
    .replace(/[^A-ZЎҚҒҲЁЧШЬЪЭЮЯOʻGʻ' ]/g, "");
}

export function normalizePassport(value = "") {
  // Avval barcha belgilarni katta harfga o'tkazamiz va faqat harf/raqamlarni qoldiramiz
  const cleaned = String(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  // Birinchi 2 ta belgi faqat harf bo'lishi kerak
  const letters = cleaned.slice(0, 2).replace(/[^A-Z]/g, "");
  // Qolgan 7 ta belgi faqat raqam bo'lishi kerak
  const digits = cleaned.slice(2).replace(/\D/g, "").slice(0, 7);
  return `${letters}${digits}`;
}

export function normalizePlateNumber(value = "") {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function cleanupObjectUrls(previews = {}) {
  Object.values(previews).forEach((item) => {
    if (item?.objectUrl) {
      try {
        URL.revokeObjectURL(item.objectUrl);
      } catch (_err) {
        console.error("Xotirani tozalashda xatolik:", _err);
      }
    }
  });
}

export function makeFilePreview(file) {
  if (!file) return null;
  const objectUrl = URL.createObjectURL(file);
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    objectUrl,
    url: objectUrl,
    source: "local",
  };
}

export function isValidImageFile(file) {
  return !!file && String(file.type || "").startsWith("image/");
}

export function getReadableFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function docRowsToPreviewMap(rows = [], fieldMap = {}) {
  return rows.reduce((acc, row) => {
    const field = Object.values(fieldMap).find(
      (item) => item.docType === row.doc_type
    );
    if (!field) return acc;
    acc[field.key] = {
      name: row.file_name || field.label,
      size: row.file_size || 0,
      type: row.mime_type || "image/jpeg",
      url: row.file_url || "",
      objectUrl: null,
      source: "remote",
    };
    return acc;
  }, {});
}

/**
 * Haydovchi ro‘yxatdan o‘tish hujjatlari — umumiy siqish moduli.
 */
export async function compressImage(file, options = {}) {
  if (!file) return null;
  if (!String(file.type || "").startsWith("image/")) return file;
  const { maxWidth = 1400, quality = 0.75, maxHeight = 2000 } = options;
  try {
    return await compressImageToFile(file, {
      maxWidth,
      maxHeight,
      quality,
      maxSizeMB: 1.2,
      skipIfUnderBytes: 700 * 1024,
    });
  } catch {
    return file;
  }
}