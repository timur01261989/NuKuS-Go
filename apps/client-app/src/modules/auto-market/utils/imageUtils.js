/**
 * Avtosavdo moduli: umumiy siqish — shared/imageUtils ga yo‘naltiriladi.
 */
import {
  compressImageToFile,
  compressImageWithMeta,
  UPLOAD_PRESETS,
} from "@/modules/shared/utils/imageUtils.js";

export { compressImageToFile, compressImageWithMeta, UPLOAD_PRESETS };

/**
 * Eski API: { file, width, height, type, size, ... }
 * @param {File|Blob} inputFile
 * @param {object} [options]
 */
export async function compressImage(inputFile, options = {}) {
  const file =
    inputFile instanceof Blob ? inputFile : inputFile?.file || inputFile;
  if (!file) throw new Error("compressImage: inputFile is required");

  const meta = await compressImageWithMeta(file, {
    maxWidth: options.maxWidth ?? 1600,
    maxHeight: options.maxHeight ?? 1600,
    maxSizeMB: options.maxSizeMB ?? 1,
    initialQuality: options.initialQuality ?? options.quality ?? 0.86,
    minQuality: options.minQuality ?? 0.55,
    qualityStep: options.qualityStep ?? 0.06,
    mimeType: options.mimeType ?? "image/jpeg",
  });

  return {
    file: meta.file,
    width: meta.width,
    height: meta.height,
    type: meta.type,
    size: meta.size,
    quality: null,
    keepExif: false,
  };
}

export function pickFirstImageFile(fileList) {
  if (!fileList || !fileList.length) return null;
  const f = fileList[0];
  if (!f.type?.startsWith("image/")) return null;
  return f;
}
