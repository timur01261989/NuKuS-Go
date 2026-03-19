/**
 * settings-reducer.unit.test.js
 * DOCX Section 10: Unit — settings reducer / settingsService
 */
import { describe, it, expect, beforeEach } from 'vitest';

// settingsService ni in-memory mock bilan test qilamiz
const store = {};
const mockLS = {
  getItem:    (k) => store[k] ?? null,
  setItem:    (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

const KEYS = {
  NIGHT_MODE:    'unigo_nightMode',
  NOTIFICATIONS: 'unigo_notificationsEnabled',
  LANGUAGE:      'unigo_language',
};

const svc = {
  getNightMode()     { return mockLS.getItem(KEYS.NIGHT_MODE)    || 'auto'; },
  setNightMode(v)    { mockLS.setItem(KEYS.NIGHT_MODE, v); },
  getNotifications() { return mockLS.getItem(KEYS.NOTIFICATIONS) !== '0'; },
  setNotifications(v){ mockLS.setItem(KEYS.NOTIFICATIONS, v ? '1' : '0'); },
  getLanguage()      { return mockLS.getItem(KEYS.LANGUAGE)      || 'uz_latn'; },
  setLanguage(v)     { mockLS.setItem(KEYS.LANGUAGE, v); },
  clearAll()         { Object.values(KEYS).forEach(k => mockLS.removeItem(k)); },
};

beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

describe('settingsService', () => {
  it('nightMode default = auto', () => {
    expect(svc.getNightMode()).toBe('auto');
  });

  it('nightMode saqlanadi va o\'qiladi', () => {
    svc.setNightMode('on');
    expect(svc.getNightMode()).toBe('on');
  });

  it('notifications default = true', () => {
    expect(svc.getNotifications()).toBe(true);
  });

  it('notifications false qilinadi', () => {
    svc.setNotifications(false);
    expect(svc.getNotifications()).toBe(false);
  });

  it('notifications true ga qaytariladi', () => {
    svc.setNotifications(false);
    svc.setNotifications(true);
    expect(svc.getNotifications()).toBe(true);
  });

  it('language saqlanadi', () => {
    svc.setLanguage('ru');
    expect(svc.getLanguage()).toBe('ru');
  });

  it('clearAll barcha kalitlarni o\'chiradi', () => {
    svc.setNightMode('on');
    svc.setNotifications(false);
    svc.setLanguage('ru');
    svc.clearAll();
    expect(svc.getNightMode()).toBe('auto');
    expect(svc.getNotifications()).toBe(true);
    expect(svc.getLanguage()).toBe('uz_latn');
  });
});
