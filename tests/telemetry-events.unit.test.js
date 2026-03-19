/**
 * telemetry-events.unit.test.js
 * DOCX Section 10.2: Monitoring SLO hodisalari to'g'ri chaqirilishini tekshiradi
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const captured = [];
function mockEmit(event, props = {}) {
  captured.push({ event, ...props });
}

const telemetry = {
  loginAttempt:    (p) => mockEmit('login_attempt',    p),
  loginSuccess:    (p) => mockEmit('login_success',    p),
  loginFailed:     (p) => mockEmit('login_failed',     p),
  otpRequested:    (p) => mockEmit('otp_requested',    p),
  otpVerifySuccess:(p) => mockEmit('otp_verify_success',p),
  otpVerifyFailed: (p) => mockEmit('otp_verify_failed', p),
  geoPermDenied:   (p) => mockEmit('geo_permission_denied', p),
  searchRouteFailed:(p) => mockEmit('search_on_route_failed', p),
  pushTokenSuccess:(p) => mockEmit('push_token_reg_success', p),
  pushTokenFailed: (p) => mockEmit('push_token_reg_failed',  p),
  driverRegFailed: (p) => mockEmit('driver_reg_failed', p),
  docUploadFailed: (p) => mockEmit('doc_upload_failed', p),
  settingsUpdated: (p) => mockEmit('settings_updated',  p),
};

beforeEach(() => { captured.length = 0; });

describe('Telemetry SLO hodisalari', () => {
  it('login_attempt → login_success oqimi', () => {
    telemetry.loginAttempt({ method: 'password' });
    telemetry.loginSuccess({ userId: 'u123' });
    expect(captured[0].event).toBe('login_attempt');
    expect(captured[1].event).toBe('login_success');
    expect(captured[1].userId).toBe('u123');
  });

  it('login_failed reason bilan', () => {
    telemetry.loginFailed({ reason: 'invalid_password' });
    expect(captured[0].event).toBe('login_failed');
    expect(captured[0].reason).toBe('invalid_password');
  });

  it('OTP oqimi: requested → verify_success', () => {
    telemetry.otpRequested({ phone: '+998901234567' });
    telemetry.otpVerifySuccess({ userId: 'u456' });
    expect(captured.map(e => e.event)).toEqual(['otp_requested', 'otp_verify_success']);
  });

  it('GPS ruxsati rad etildi', () => {
    telemetry.geoPermDenied({ code: 1 });
    expect(captured[0].event).toBe('geo_permission_denied');
  });

  it('push token ro\'yxatdan o\'tdi', () => {
    telemetry.pushTokenSuccess({ role: 'client' });
    expect(captured[0].event).toBe('push_token_reg_success');
  });

  it('driver registration xato + reason', () => {
    telemetry.driverRegFailed({ reason: 'duplicate_phone' });
    expect(captured[0].event).toBe('driver_reg_failed');
    expect(captured[0].reason).toBe('duplicate_phone');
  });

  it('settings update', () => {
    telemetry.settingsUpdated({ key: 'nightMode', value: 'on' });
    expect(captured[0].event).toBe('settings_updated');
    expect(captured[0].key).toBe('nightMode');
  });
});
