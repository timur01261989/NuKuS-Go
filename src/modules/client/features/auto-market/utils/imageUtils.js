/**
 * compressImage(file, options)
 * - Browser canvas based image compression
 * - Returns: { file: Blob, width, height, type, size }
 *
 * Usage:
 *   const { file: blob } = await compressImage(file, { maxWidth: 1600, maxSizeMB: 0.9 });
 *   // upload blob
 */
export async function compressImage(inputFile, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    maxSizeMB = 1.0,
    mimeType = "image/jpeg",
    initialQuality = 0.86,
    minQuality = 0.55,
    qualityStep = 0.06,
    keepExif = false, // NOTE: Canvas drops EXIF. KeepExif would require extra libs.
  } = options;

  if (!inputFile) throw new Error("compressImage: inputFile is required");

  const file = inputFile instanceof Blob ? inputFile : inputFile?.file || inputFile;
  const inType = file.type || "image/jpeg";

  // If already small enough and jpeg/png/webp, return as-is
  const maxBytes = Math.round(maxSizeMB * 1024 * 1024);
  if (file.size <= maxBytes && (inType.startsWith("image/") || mimeType)) {
    return { file, width: null, height: null, type: inType, size: file.size };
  }

  const bitmap = await createImageBitmap(file);

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
  // Better downscale quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const toBlob = (q) =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
        mimeType,
        q
      );
    });

  // Try compressing by quality until under target or minQuality reached
  let quality = initialQuality;
  let out = await toBlob(quality);

  while (out.size > maxBytes && quality > minQuality) {
    quality = Math.max(minQuality, +(quality - qualityStep).toFixed(2));
    out = await toBlob(quality);
  }

  return {
    file: out,
    width: targetW,
    height: targetH,
    type: out.type || mimeType,
    size: out.size,
    quality,
    keepExif,
  };
}

/**
 * Helper: pick first image file from <input type="file" multiple />
 */
export function pickFirstImageFile(fileList) {
  if (!fileList || !fileList.length) return null;
  const f = fileList[0];
  if (!f.type?.startsWith("image/")) return null;
  return f;
}
