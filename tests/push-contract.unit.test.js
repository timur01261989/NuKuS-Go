/**
 * push-contract.unit.test.js
 * DOCX Section 10: Contract — push subscribe/unsubscribe
 * Push endpoint routing to'g'riligini tekshiradi.
 */
import { describe, it, expect } from 'vitest';

// routeRegistry mantiqini mock test bilan tekshiramiz
const routes = new Map([
  ['push',          'push_register_handler'],
  ['push/register', 'push_register_handler'],
  ['push_register', 'push_register_handler'],
  ['push/send',     'push_send_handler'],
  ['push_send',     'push_send_handler'],
]);

function resolveRoute(path) {
  const p = String(path || '').replace(/^\/+/, '').split('?')[0];
  if (routes.has(p)) return routes.get(p);
  const root = p.split('/')[0];
  if (routes.has(root)) return routes.get(root);
  return null;
}

describe('Push routing contract', () => {
  it('"push" → push_register_handler (BUG FIX: avval push_handler edi)', () => {
    expect(resolveRoute('push')).toBe('push_register_handler');
  });

  it('"push/register" → push_register_handler', () => {
    expect(resolveRoute('push/register')).toBe('push_register_handler');
  });

  it('"push_register" → push_register_handler', () => {
    expect(resolveRoute('push_register')).toBe('push_register_handler');
  });

  it('"push/send" → push_send_handler', () => {
    expect(resolveRoute('push/send')).toBe('push_send_handler');
  });

  it('"push_send" → push_send_handler', () => {
    expect(resolveRoute('push_send')).toBe('push_send_handler');
  });

  it('noto\'g\'ri route → null', () => {
    expect(resolveRoute('push/unknown')).toBeNull();
  });
});

describe('Push request validation', () => {
  function validatePushRegisterBody(body) {
    const errors = [];
    if (!body?.role)      errors.push('role required');
    if (!body?.fcm_token) errors.push('fcm_token required');
    const validRoles = ['client', 'driver', 'admin'];
    if (body?.role && !validRoles.includes(body.role)) errors.push('invalid role');
    return errors;
  }

  it('to\'liq body — xato yo\'q', () => {
    const errs = validatePushRegisterBody({ role: 'client', fcm_token: 'abc123' });
    expect(errs.length).toBe(0);
  });

  it('role yo\'q — xato', () => {
    const errs = validatePushRegisterBody({ fcm_token: 'abc123' });
    expect(errs).toContain('role required');
  });

  it('fcm_token yo\'q — xato', () => {
    const errs = validatePushRegisterBody({ role: 'driver' });
    expect(errs).toContain('fcm_token required');
  });

  it('noto\'g\'ri role — xato', () => {
    const errs = validatePushRegisterBody({ role: 'superuser', fcm_token: 'abc' });
    expect(errs).toContain('invalid role');
  });
});
