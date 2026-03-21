/**
 * errorNormalizer.js — Yagona xato normalizatsiya qatlami
 *
 * DOCX tavsiyasi: Error normalization va correlation id yo'q yoki sust.
 * Bu modul barcha API xatolarini bir xil tuzilmaga keltiradi va
 * correlation id ni avtomatik qo'shadi.
 *
 * Barcha modullar errorAdapter.js bilan birga shu modulni ham ishlatadi.
 */

import { getErrorMessage } from './errorAdapter.js';

// ── Correlation ID ────────────────────────────────────────────────────────────
let _correlationCounter = 0;

export function generateCorrelationId(prefix = 'req') {
  _correlationCounter++;
  const ts   = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}_${ts}_${rand}_${_correlationCounter}`;
}

// ── NormalizedError tuzilmasi ─────────────────────────────────────────────────
/**
 * @typedef {Object} NormalizedError
 * @property {string}      message       — Foydalanuvchi uchun matn
 * @property {string}      code          — Machine-readable kod (masalan: 'NETWORK_ERROR')
 * @property {number|null} status        — HTTP status (agar mavjud bo'lsa)
 * @property {string}      correlationId — Tracing ID
 * @property {boolean}     isNetwork     — Tarmoq muammosi
 * @property {boolean}     isTimeout     — Timeout
 * @property {boolean}     isAuth        — 401/403
 * @property {boolean}     isValidation  — 400/422
 * @property {boolean}     isServer      — 5xx
 * @property {*}           raw           — Asl xato ob'ekt
 */

export function normalizeError(error, context = {}) {
  const correlationId = context.correlationId || generateCorrelationId(context.prefix || 'err');
  const message       = getErrorMessage(error, 'Xatolik yuz berdi');
  const status        = error?.status   ?? error?.statusCode ?? null;
  const code          = error?.code     ?? error?.name       ?? deriveCode(error, status);

  return {
    message,
    code,
    status,
    correlationId,
    isNetwork:    !!(error?.isNetworkError || error?.name === 'NetworkError' || !navigator.onLine),
    isTimeout:    !!(error?.isTimeout      || error?.name === 'TimeoutError'),
    isAbort:      !!(error?.isAbort        || error?.name === 'AbortError'),
    isAuth:       status === 401 || status === 403,
    isValidation: status === 400 || status === 422,
    isServer:     typeof status === 'number' && status >= 500,
    raw:          error,
    context:      context.label || null,
  };
}

function deriveCode(error, status) {
  if (!status && !error) return 'UNKNOWN';
  if (error?.name === 'AbortError')   return 'ABORTED';
  if (error?.name === 'TimeoutError') return 'TIMEOUT';
  if (!navigator.onLine)              return 'OFFLINE';
  if (status === 401)                 return 'UNAUTHORIZED';
  if (status === 403)                 return 'FORBIDDEN';
  if (status === 404)                 return 'NOT_FOUND';
  if (status === 429)                 return 'RATE_LIMITED';
  if (typeof status === 'number' && status >= 500) return 'SERVER_ERROR';
  if (typeof status === 'number' && status >= 400) return 'CLIENT_ERROR';
  return 'UNKNOWN';
}

/**
 * React hook yoki oddiy funksiya sifatida ishlatish uchun:
 *   const err = normalizeError(e, { label: 'createOrder' });
 *   if (err.isNetwork) showOfflineBanner();
 *   if (err.isAuth)    navigate('/login');
 *   logger.error(err.message, { correlationId: err.correlationId });
 */

export default { normalizeError, generateCorrelationId };
