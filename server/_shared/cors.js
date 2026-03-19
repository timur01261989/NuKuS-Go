import { getRequestLang, translatePayload } from './serverI18n.js';
import crypto from "crypto";

/** * CORS sarlavhalarini qo'yish. 
 * Bu brauzerga API'ga murojaat qilishga ruxsat beradi.
 */
export function applyCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/** * JSON javob qaytarish uchun yordamchi funksiya.
 * Avtomatik ravishda status code va headerlarni to'g'irlaydi.
 */
export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const lang = getRequestLang(res?.req, body && typeof body === 'object' ? body : null);
  const translated = translatePayload(body === undefined ? null : body, lang);
  res.end(JSON.stringify(translated));
}

/** 400 Bad Request qaytarish */
export function badRequest(res, msg = "Bad Request", extra = {}) {
  return json(res, 400, { ok: false, error: msg, ...extra });
}

/** 500 Server Error qaytarish */
export function serverError(res, err) {
  console.error("SERVER ERROR:", err); // Xatoni logga chiqarish (juda muhim)
  return json(res, 500, { 
    ok: false, 
    error: "Server error", 
    details: String(err?.message || err) 
  });
}

/** Hozirgi vaqtni ISO formatda olish */
export function nowIso() { 
  return new Date().toISOString(); 
}

/** Unikal ID yaratish */
export function uid(prefix = "id") {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}_${Date.now()}`;
}

/** Telefon raqamni tekshirish */
export function isPhone(s) {
  const t = String(s || "").trim();
  return /^\+?\d{7,15}$/.test(t);
}

/** Sonni ma'lum oraliqda cheklash (min/max) */
export function clampInt(v, min, max, def) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

// In-memory store (demo uchun). 
// Eslatma: Serverless funksiyalarda bu har doim ham saqlanib qolmaydi. 
// Haqiqiy loyihada Supabase yoki Redis ishlatish kerak.
const memory = globalThis.__NUKUSGO_STORE__ || (globalThis.__NUKUSGO_STORE__ = {
  listings: [],
  orders: [],
  driver_locations: {},
});

export function store() { return memory; }

// Oddiy rate-limit (xotirada saqlash)
const rate = globalThis.__NUKUSGO_RATE__ || (globalThis.__NUKUSGO_RATE__ = new Map());

export function hit(key, minIntervalMs = 800) {
  const now = Date.now();
  const last = rate.get(key) || 0;
  if (now - last < minIntervalMs) return false;
  rate.set(key, now);
  return true;
}