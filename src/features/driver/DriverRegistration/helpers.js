export function digitsOnly(value = "") {
  return String(value).replace(/\D/g, "");
}

export function normalizePhone(value = "") {
  return digitsOnly(value).slice(0, 9);
}

export function cleanupObjectUrls(previews = {}) {
  Object.values(previews).forEach((item) => {
    if (item?.objectUrl) {
      try { URL.revokeObjectURL(item.objectUrl); } catch (_err) {}
    }
  });
}

export function makeFilePreview(file) {
  if (!file) return null;
  const objectUrl = URL.createObjectURL(file);
  return { name: file.name, size: file.size, type: file.type, objectUrl, url: objectUrl, source: "local" };
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
    const field = Object.values(fieldMap).find((item) => item.docType === row.doc_type);
    if (!field) return acc;
    acc[field.key] = { name: row.file_name || field.label, size: row.file_size || 0, type: row.mime_type || "image/jpeg", url: row.file_url || "", objectUrl: null, source: "remote" };
    return acc;
  }, {});
}

export async function compressImage(file, options = {}) {
  if (!file) return null;
  if (!String(file.type || "").startsWith("image/")) return file;
  const { maxWidth = 1400, quality = 0.75, maxHeight = 2000 } = options;
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Faylni o'qishda xato"));
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Rasmni o'qishda xato"));
    img.src = dataUrl;
  });
  let { width, height } = image;
  if (width <= maxWidth && height <= maxHeight && file.size <= 700 * 1024) return file;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  const targetWidth = Math.max(1, Math.round(width * ratio));
  const targetHeight = Math.max(1, Math.round(height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return file;
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) return reject(new Error("Rasmni siqishda xato yuz berdi"));
      resolve(result);
    }, "image/jpeg", quality);
  });
  const newName = String(file.name || "image").replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
}
