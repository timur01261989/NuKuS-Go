export function digitsOnly(value = "") {
  return String(value).replace(/\D/g, "");
}

export function normalizePhone(value = "") {
  const digits = digitsOnly(value).slice(0, 9);
  return digits;
}

export function cleanupObjectUrls(previews = {}) {
  Object.values(previews).forEach((item) => {
    if (item?.objectUrl) {
      try {
        URL.revokeObjectURL(item.objectUrl);
      } catch (_err) {
        // noop
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

export function getImageMimeType(file) {
  const type = String(file?.type || "").toLowerCase();
  if (type === "image/png") return "image/png";
  if (type === "image/webp") return "image/webp";
  return "image/jpeg";
}

export function fileExtensionByMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function compressImage(file, options = {}) {
  if (!file) return null;

  if (!String(file.type || "").startsWith("image/")) {
    return file;
  }

  const {
    maxWidth = 1400,
    quality = 0.75,
    maxHeight = 2000,
  } = options;

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);

  let { width, height } = image;

  if (width <= maxWidth && height <= maxHeight && file.size <= 700 * 1024) {
    return file;
  }

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

  const mime = getImageMimeType(file) === "image/png" ? "image/jpeg" : "image/jpeg";

  const blob = await canvasToBlob(canvas, mime, quality);
  if (!blob) return file;

  const ext = fileExtensionByMime(mime);
  const safeBaseName = String(file.name || "image")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_");

  return new File([blob], `${safeBaseName}.${ext}`, {
    type: mime,
    lastModified: Date.now(),
  });
}

export function buildExistingPreview(documentRow) {
  if (!documentRow) return null;

  return {
    id: documentRow.id,
    name: documentRow.file_name,
    size: documentRow.file_size,
    type: documentRow.mime_type,
    url: documentRow.file_url,
    source: "remote",
    docType: documentRow.doc_type,
  };
}

export function docRowsToPreviewMap(rows = [], fieldMap = {}) {
  return rows.reduce((acc, row) => {
    const matchedField = Object.values(fieldMap).find(
      (field) => field.docType === row.doc_type
    );

    if (matchedField) {
      acc[matchedField.key] = buildExistingPreview(row);
    }

    return acc;
  }, {});
}

export function isValidImageFile(file) {
  return !!file && String(file.type || "").startsWith("image/");
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("File o'qishda xato"));
    reader.readAsDataURL(file);
  });
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Rasmni yuklashda xato"));
    image.src = src;
  });
}

async function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}
