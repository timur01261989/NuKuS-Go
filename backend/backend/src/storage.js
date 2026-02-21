import fs from "fs";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export async function saveBufferToDisk({ jobId, filename, buffer }) {
  const safe = String(filename || "file").replace(/[^\w.\-]+/g, "_");
  const p = path.join(UPLOAD_DIR, `${jobId}_${Date.now()}_${safe}`);
  await fs.promises.writeFile(p, buffer);
  return p; // queue gets ONLY this path
}
