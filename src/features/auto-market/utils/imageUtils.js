/**
 * compressImage(file, opts)
 * - Browser canvas orqali rasmni siqadi
 * - maxSizeMB: 1.2MB default
 * - maxWidthOrHeight: 1600 default
 */
export async function compressImage(file, opts = {}) {
  const maxSizeMB = opts.maxSizeMB ?? 1.2;
  const maxWidthOrHeight = opts.maxWidthOrHeight ?? 1600;

  if (!file || !file.type?.startsWith("image/")) return file;

  const img = await readImage(file);
  const { width, height } = img;

  const scale = Math.min(1, maxWidthOrHeight / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, targetW, targetH);

  let quality = 0.9;
  let blob = await canvasToBlob(canvas, "image/jpeg", quality);
  const maxBytes = maxSizeMB * 1024 * 1024;

  while (blob.size > maxBytes && quality > 0.55) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
  }

  return new File([blob], renameExt(file.name, "jpg"), { type: "image/jpeg" });
}

function renameExt(name, ext) {
  const base = String(name || "image").replace(/\.[^.]+$/, "");
  return `${base}.${ext}`;
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}
