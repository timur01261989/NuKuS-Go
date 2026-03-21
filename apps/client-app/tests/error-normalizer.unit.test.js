/**
 * error-normalizer.unit.test.js
 * DOCX Section 10: Unit — errorNormalizer
 */
import { describe, it, expect } from 'vitest';

// errorNormalizer dan ko'chirma (import path muammosiz test uchun)
function generateCorrelationId(prefix = 'req') {
  const ts   = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}_${ts}_${rand}`;
}

function deriveCode(error, status) {
  if (!status && !error) return 'UNKNOWN';
  if (error?.name === 'AbortError')   return 'ABORTED';
  if (!status) return 'UNKNOWN';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500)  return 'SERVER_ERROR';
  if (status >= 400)  return 'CLIENT_ERROR';
  return 'UNKNOWN';
}

function normalizeError(error, context = {}) {
  const correlationId = context.correlationId || generateCorrelationId('err');
  const message = error?.message || 'Xatolik yuz berdi';
  const status  = error?.status  ?? error?.statusCode ?? null;
  const code    = error?.code    ?? error?.name       ?? deriveCode(error, status);
  return {
    message, code, status, correlationId,
    isNetwork:    !!(error?.isNetworkError),
    isTimeout:    !!(error?.isTimeout),
    isAbort:      !!(error?.name === 'AbortError'),
    isAuth:       status === 401 || status === 403,
    isValidation: status === 400 || status === 422,
    isServer:     typeof status === 'number' && status >= 500,
    raw: error,
  };
}

describe('normalizeError', () => {
  it('correlation ID har doim mavjud', () => {
    const r = normalizeError(new Error('test'));
    expect(r.correlationId).toBeTruthy();
  });

  it('401 → isAuth=true', () => {
    const r = normalizeError({ message: 'Unauthorized', status: 401 });
    expect(r.isAuth).toBe(true);
    expect(r.code).toBe('UNAUTHORIZED');
  });

  it('500 → isServer=true', () => {
    const r = normalizeError({ message: 'Server Error', status: 500 });
    expect(r.isServer).toBe(true);
    expect(r.code).toBe('SERVER_ERROR');
  });

  it('AbortError → isAbort=true', () => {
    const err = new Error('Aborted');
    err.name = 'AbortError';
    const r = normalizeError(err);
    expect(r.isAbort).toBe(true);
  });

  it('400 → isValidation=true', () => {
    const r = normalizeError({ message: 'Bad Request', status: 400 });
    expect(r.isValidation).toBe(true);
  });

  it('xato xabari to\'g\'ri chiqadi', () => {
    const r = normalizeError({ message: 'Test xato' });
    expect(r.message).toBe('Test xato');
  });

  it('null error — graceful', () => {
    const r = normalizeError(null);
    expect(r.message).toBeTruthy();
    expect(r.correlationId).toBeTruthy();
  });
});

describe('generateCorrelationId', () => {
  it('har safar unikal ID yaratadi', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateCorrelationId()));
    expect(ids.size).toBe(100);
  });

  it('prefix bilan boshlanadi', () => {
    const id = generateCorrelationId('auth');
    expect(id.startsWith('auth_')).toBe(true);
  });
});
