/**
 * Mijoz tomonida rasm siqish — serverga yuborishdan oldin.
 *
 * Strategiya:
 * 1) createImageBitmap + Canvas — tez, asosiy yo‘l (decode asinxron, downscale sifatli).
 * 2) Xato / qo‘llab-quvvatlanmagan format → browser-image-compression (Web Worker).
 * 3) Oxirgi fallback — asl fayl.
 */
import imageCompression from "browser-image-compression";
import { serviceT } from "../services/serviceI18n.js";

/** Tayyor profillar (ixtiyoriy import) */
export const UPLOAD_PRESETS = {
  /** Profil avatari */
  avatar: {
    maxWidth: 1024,
    maxHeight: 1024,
    maxSizeMB: 0.55,
    initialQuality: 0.82,
    mimeType: "image/jpeg",
  },
  /** Avtosavdo e’lon rasmlari */
  autoMarket: {
    maxWidth: 1920,
    maxHeight: 1920,
    maxSizeMB: 0.95,
    initialQuality: 0.85,
    mimeType: "image/jpeg",
  },
  /** Haydovchi hujjatlari / verifikatsiya */
  document: {
    maxWidth: 1600,
    maxHeight: 2200,
    maxSizeMB: 0.85,
    initialQuality: 0.8,
    mimeType: "image/jpeg",
  },
  /** Viloyatlararo pochta / umumiy yuklar */
  parcel: {
    maxWidth: 1600,
    maxHeight: 1600,
    maxSizeMB: 0.8,
    initialQuality: 0.82,
    mimeType: "image/jpeg",
  },
  /** Yetkazib berish / kichik ilova fotolari */
  delivery: {
    maxWidth: 1400,
    maxHeight: 1400,
    maxSizeMB: 0.7,
    initialQuality: 0.8,
    mimeType: "image/jpeg",
  },
  /** Yuk tashish e’loni */
  freight: {
    maxWidth: 1600,
    maxHeight: 1600,
    maxSizeMB: 0.75,
    initialQuality: 0.8,
    mimeType: "image/jpeg",
  },
};

/**
 * @param {Blob} blob
 * @param {string} name
 * @param {string} mimeType
 * @returns {File}
 */
export function fileFromBlob(blob, name, mimeType) {
  return new File([blob], name, { type: mimeType, lastModified: Date.now() });
}

function outputBaseName(originalName) {
  return String(originalName || "image").replace(/\.[^./\\]+$/, "") || "image";
}

function outputFileName(originalName, mimeType) {
  const ext = mimeType === "image/webp" ? "webp" : "jpg";
  return `${outputBaseName(originalName)}.${ext}`;
}

/**
 * Canvas orqali siqish (JPEG). Shaffof PNG → oq fon.
 * @param {Blob|File} input
 * @param {object} opts
 * @returns {Promise<File>}
 */
async function compressWithCanvas(input, opts) {
  const {
    maxWidth,
    maxHeight,
    maxSizeMB,
    mimeType,
    initialQuality,
    minQuality,
    qualityStep,
  } = opts;

  const maxBytes = Math.round(maxSizeMB * 1024 * 1024);
  let bitmap;

  try {
    bitmap = await createImageBitmap(input);
  } catch {
    throw new Error("createImageBitmap_failed");
  }

  let { width, height } = bitmap;
  const wRatio = maxWidth / width;
  const hRatio = maxHeight / height;
  const ratio = Math.min(1, wRatio, hRatio);
  const targetW = Math.max(1, Math.round(width * ratio));
  const targetH = Math.max(1, Math.round(height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("no_2d_context");

  if (mimeType === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  try {
    bitmap.close();
  } catch {
    /* ignore */
  }

  const toBlob = (q) =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob_failed"))),
        mimeType,
        q
      );
    });

  let quality = initialQuality;
  let blob = await toBlob(quality);

  while (blob.size > maxBytes && quality > minQuality + 0.01) {
    quality = Math.max(minQuality, +(quality - qualityStep).toFixed(2));
    blob = await toBlob(quality);
  }

  const name = outputFileName(input instanceof File ? input.name : "photo.jpg", mimeType);
  return fileFromBlob(blob, name, mimeType);
}

/**
 * browser-image-compression (Web Worker)
 * @param {File|Blob} input
 * @param {object} opts
 */
async function compressWithLibrary(input, opts) {
  const file = input instanceof File ? input : fileFromBlob(input, "upload.jpg", input.type || "image/jpeg");
  const maxSide = Math.max(opts.maxWidth, opts.maxHeight);
  const compressed = await imageCompression(file, {
    maxSizeMB: opts.maxSizeMB,
    maxWidthOrHeight: maxSide,
    useWebWorker: true,
    fileType: opts.mimeType,
    initialQuality: opts.initialQuality,
  });
  if (compressed instanceof File) return compressed;
  return fileFromBlob(
    compressed,
    outputFileName(file.name, opts.mimeType),
    opts.mimeType
  );
}

/**
 * Asosiy API: File qaytaradi (Supabase storage, FormData uchun).
 *
 * @param {File|Blob} file
 * @param {object} [options]
 * @param {number} [options.maxWidth]
 * @param {number} [options.maxHeight]
 * @param {number} [options.maxSizeMB]
 * @param {string} [options.mimeType]
 * @param {number} [options.initialQuality]
 * @param {number} [options.minQuality]
 * @param {number} [options.qualityStep]
 * @param {number} [options.quality] — StepDocuments bilan mos (initialQuality ustidan)
 * @param {number} [options.skipIfUnderBytes] — shu hajmdan kichik bo‘lsa o‘zgartirmasdan qaytaradi
 * @returns {Promise<File>}
 */
export async function compressImageToFile(file, options = {}) {
  if (!file) {
    throw new Error("compressImageToFile: fayl kerak");
  }

  const type = file.type || "";
  if (!type.startsWith("image/")) {
    return file instanceof File ? file : fileFromBlob(file, "file", type || "application/octet-stream");
  }

  const merged = {
    maxWidth: options.maxWidth ?? 1920,
    maxHeight: options.maxHeight ?? 1920,
    maxSizeMB: options.maxSizeMB ?? 1,
    mimeType: options.mimeType ?? "image/jpeg",
    initialQuality:
      options.quality != null ? options.quality : (options.initialQuality ?? 0.82),
    minQuality: options.minQuality ?? 0.52,
    qualityStep: options.qualityStep ?? 0.07,
    skipIfUnderBytes: options.skipIfUnderBytes ?? null,
  };

  const skipBytes = merged.skipIfUnderBytes;
  if (skipBytes != null && file.size <= skipBytes) {
    return file instanceof File ? file : fileFromBlob(file, "image.jpg", type);
  }

  try {
    return await compressWithCanvas(file, merged);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(serviceT("image_compress_error"), err?.message || err);
    }
    try {
      return await compressWithLibrary(file, merged);
    } catch (err2) {
      console.error(serviceT("image_compress_error"), err2);
      return file instanceof File ? file : fileFromBlob(file, file.name || "image.jpg", type);
    }
  }
}

/**
 * Eski chaqiruqlar: bitta argument, hujjat profili.
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function compressImage(file) {
  return compressImageToFile(file, UPLOAD_PRESETS.document);
}

/**
 * Obekt qaytaruvchi API (auto-market / debug).
 * @returns {Promise<{ file: File, width: number, height: number, size: number, type: string }>}
 */
export async function compressImageWithMeta(file, options = {}) {
  const out = await compressImageToFile(file, options);
  return {
    file: out,
    width: null,
    height: null,
    size: out.size,
    type: out.type,
  };
}
