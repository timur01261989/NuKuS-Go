import { supabase } from "@/lib/supabase";

export const PHONE_PREFIX = "+998";

export function sanitizeFilename(originalName) {
  const name = String(originalName || "file")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/^\.+/, "");
  return name.length ? name.slice(0, 120) : `file_${Date.now()}`;
}

export function buildStoragePath(userId, file) {
  const safeName = sanitizeFilename(file?.name);
  const rand = Math.random().toString(36).slice(2, 10);
  return `driver_applications/${userId}/${Date.now()}_${rand}_${safeName}`;
}

export async function uploadToStorage(userId, file, bucket = "driver-docs") {
  if (!file) return null;
  const filePath = buildStoragePath(userId, file);
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;
  return filePath;
}

export function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
  if (!digits) return null;
  return `${PHONE_PREFIX}${digits}`;
}

export function splitPhoneLocal(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("998")) return digits.slice(3, 12);
  return digits.slice(0, 9);
}

export function toNullableNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
