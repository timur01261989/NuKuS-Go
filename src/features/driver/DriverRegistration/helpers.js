import { storageFolderMap } from "./uploadConfig";

export function onlyDigits(value = "") {
  return String(value).replace(/\D+/g, "");
}

export function normalizePhoneInput(value = "") {
  return onlyDigits(value).slice(0, 9);
}

export function normalizePlateNumber(value = "") {
  return String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 12);
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
  } catch {
    // noop
  }
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

export function buildApplicationPayload(formData, userId = null) {
  return {
    user_id: userId,
    first_name: String(formData.firstName || "").trim() || null,
    last_name: String(formData.lastName || "").trim() || null,
    phone: formData.phone ? `+998${formData.phone}` : null,
    vehicle_type: formData.vehicleType || null,
    brand: String(formData.brand || "").trim() || null,
    model: String(formData.model || "").trim() || null,
    plate_number: String(formData.plateNumber || "").trim() || null,
    status: "pending",
  };
}

export function isValidImageFile(file) {
  return !!file && String(file.type || "").startsWith("image/");
}

export function makeFilePreview(file) {
  if (!file) return null;

  const objectUrl = URL.createObjectURL(file);

  return {
    name: file.name || null,
    size: file.size || null,
    type: file.type || null,
    objectUrl,
    url: objectUrl,
    source: "local",
  };
}

export function buildExistingPreview(documentRow) {
  if (!documentRow) return null;

  return {
    id: documentRow.id,
    name: documentRow.file_path
      ? String(documentRow.file_path).split("/").pop()
      : documentRow.doc_type,
    size: documentRow.file_size || null,
    type: documentRow.mime_type || null,
    url: documentRow.file_url || null,
    source: "remote",
    docType: documentRow.doc_type || null,
    path: documentRow.file_path || null,
  };
}

export function cleanupObjectUrls(previews = {}) {
  Object.values(previews).forEach((item) => {
    if (item?.objectUrl) {
      try {
        URL.revokeObjectURL(item.objectUrl);
      } catch {
        // noop
      }
    }
  });
}

export async function compressImage(file, options = {}) {
  if (!file) return null;
  if (!isValidImageFile(file)) return file;

  const { maxWidth = 1400, quality = 0.75, maxHeight = 2200 } = options;

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);

  let { width, height } = image;

  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio, 1);

  const targetWidth = Math.max(1, Math.round(width * ratio));
  const targetHeight = Math.max(1, Math.round(height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return file;

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  const mimeType = "image/jpeg";
  const blob = await canvasToBlob(canvas, mimeType, quality);
  if (!blob) return file;

  const safeBaseName = String(file.name || "image")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_");

  const compressedFile = new File([blob], `${safeBaseName}.jpg`, {
    type: mimeType,
    lastModified: Date.now(),
  });

  if (compressedFile.size > 0 && compressedFile.size < file.size) {
    return compressedFile;
  }

  if (width > maxWidth || height > maxHeight) {
    return compressedFile;
  }

  return file;
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Faylni o'qishda xato"));
    reader.readAsDataURL(file);
  });
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Rasmni o'qishda xato"));
    image.src = src;
  });
}

async function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}
