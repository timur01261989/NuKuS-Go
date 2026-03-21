/**
 * auth-validators.unit.test.js
 * DOCX Section 10: Unit — auth validators
 */
import { describe, it, expect } from 'vitest';

// ── validateLoginInput (auth.logic.js dan) ──────────────────────────────────
function validateLoginInput({ phone, password, t = {} }) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits || digits.length < 9) {
    return { ok: false, message: t.phoneRequired || 'Telefon raqami noto\'g\'ri' };
  }
  if (!password || password.length < 6) {
    return { ok: false, message: t.passwordRequired || 'Parol kamida 6 ta belgi' };
  }
  return { ok: true, digits };
}

// ── validatePersonalStep (validators.js dan) ────────────────────────────────
const PHONE_RE_9 = /^\d{9,12}$/;
function validatePersonalStep(form) {
  const errors = {};
  if (!form.lastName?.trim())   errors.lastName   = 'Familiya kiritilishi shart';
  if (!form.firstName?.trim())  errors.firstName  = 'Ism kiritilishi shart';
  const cleanPhone = String(form.phone || '').replace(/\D/g, '');
  if (!PHONE_RE_9.test(cleanPhone)) errors.phone = 'Telefon raqami noto\'g\'ri';
  return errors;
}

// ── validateVehicleStep ─────────────────────────────────────────────────────
function validateVehicleStep(form) {
  const errors = {};
  if (!form.vehicleType) errors.vehicleType = 'Transport turini tanlang';
  if (!form.brand?.trim())  errors.brand  = 'Marka kiritilishi shart';
  if (!form.model?.trim())  errors.model  = 'Model kiritilishi shart';
  return errors;
}

describe('validateLoginInput', () => {
  it('to\'g\'ri telefon va parolda ok qaytaradi', () => {
    const r = validateLoginInput({ phone: '901234567', password: 'secret1' });
    expect(r.ok).toBe(true);
    expect(r.digits).toBe('901234567');
  });

  it('qisqa telefonda xato qaytaradi', () => {
    const r = validateLoginInput({ phone: '9012', password: 'secret1' });
    expect(r.ok).toBe(false);
  });

  it('qisqa parolda xato qaytaradi', () => {
    const r = validateLoginInput({ phone: '901234567', password: '123' });
    expect(r.ok).toBe(false);
  });

  it('bo\'sh telefon va parolda xato qaytaradi', () => {
    const r = validateLoginInput({ phone: '', password: '' });
    expect(r.ok).toBe(false);
  });
});

describe('validatePersonalStep', () => {
  it('to\'liq ma\'lumot — xato yo\'q', () => {
    const errs = validatePersonalStep({ lastName: 'Karimov', firstName: 'Aziz', phone: '901234567' });
    expect(Object.keys(errs).length).toBe(0);
  });

  it('ism yo\'q — xato', () => {
    const errs = validatePersonalStep({ lastName: 'Karimov', firstName: '', phone: '901234567' });
    expect(errs.firstName).toBeDefined();
  });

  it('noto\'g\'ri telefon — xato', () => {
    const errs = validatePersonalStep({ lastName: 'Karimov', firstName: 'Aziz', phone: '123' });
    expect(errs.phone).toBeDefined();
  });
});

describe('validateVehicleStep', () => {
  it('to\'liq — xato yo\'q', () => {
    const errs = validateVehicleStep({ vehicleType: 'light_car', brand: 'Nexia', model: 'N3' });
    expect(Object.keys(errs).length).toBe(0);
  });

  it('marka yo\'q — xato', () => {
    const errs = validateVehicleStep({ vehicleType: 'light_car', brand: '', model: 'N3' });
    expect(errs.brand).toBeDefined();
  });

  it('transport turi yo\'q — xato', () => {
    const errs = validateVehicleStep({ vehicleType: '', brand: 'Nexia', model: 'N3' });
    expect(errs.vehicleType).toBeDefined();
  });
});
