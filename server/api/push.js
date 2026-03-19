/**
 * server/api/push.js — DEPRECATED WRAPPER
 *
 * BUG (DOCX: push endpoint contract nomosligi):
 *   Bu fayl /api/push route'da turdi, lekin o'zining kommentida
 *   "POST /api/push/register" deb yozilgan edi — noto'g'ri contract.
 *   Klient src/native/push.js to'g'ri: /api/push/register ni chaqiradi.
 *
 * TUZATISH:
 *   routeRegistry.js da "push" route endi push_register.js ga yo'naltiriladi.
 *   Bu fayl backwards-compatibility uchun saqlanadi — push_register ga delegat qiladi.
 */
export { default } from './push_register.js';
