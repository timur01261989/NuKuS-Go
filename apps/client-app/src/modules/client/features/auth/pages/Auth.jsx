/**
 * Auth.jsx — Eski kirish nuqtasi (backwards-compatible re-export)
 *
 * DOCX tavsiyasiga ko'ra Auth sahifasi bo'lingan:
 *   AuthPage.jsx    — composition root (asosiy)
 *   AuthHero.jsx    — brand/trust header
 *   AuthForm.jsx    — login forma
 *   useLoginController.js — barcha biznes logika
 *
 * Barcha import'lar (router, tests) buzilmasin deb bu fayl saqlanadi.
 * Yangi kod AuthPage.jsx ni import qilsin.
 */
export { default } from './AuthPage.jsx';
