/**
 * telemetryEvents.js — Auth, Settings, Location, Registration telemetriya hodisalari
 *
 * DOCX Section 10.2 Monitoring / SLO:
 *   login success rate, otp verify success rate, auth_failed by reason
 *   settings update success rate
 *   location permission denial rate, search_on_route fail rate
 *   driver registration submit success rate, document upload fail rate
 *   push token registration success rate
 *
 * Ishlatish:
 *   import { telemetry } from '@/modules/shared/utils/telemetryEvents';
 *   telemetry.loginAttempt({ method: 'password' });
 *   telemetry.loginSuccess({ userId: '...' });
 *   telemetry.loginFailed({ reason: 'invalid_password' });
 */

const ENABLED = import.meta.env?.VITE_TELEMETRY_ENABLED !== 'false';

function emit(event, props = {}) {
  if (!ENABLED) return;
  const payload = { event, ts: Date.now(), ...props };
  // Production: window.analytics?.track(event, payload) yoki custom endpoint
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[telemetry]', event, props);
  }
  try {
    if (typeof window !== 'undefined' && window.__unigoTelemetry) {
      window.__unigoTelemetry(payload);
    }
  } catch { /* silent */ }
}

export const telemetry = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  loginAttempt:    (p = {}) => emit('login_attempt',    p),
  loginSuccess:    (p = {}) => emit('login_success',    p),
  loginFailed:     (p = {}) => emit('login_failed',     p),  // { reason }

  otpRequested:    (p = {}) => emit('otp_requested',    p),
  otpVerifySuccess:(p = {}) => emit('otp_verify_success',p),
  otpVerifyFailed: (p = {}) => emit('otp_verify_failed', p), // { reason }

  registerAttempt: (p = {}) => emit('register_attempt', p),
  registerSuccess: (p = {}) => emit('register_success', p),
  registerFailed:  (p = {}) => emit('register_failed',  p),  // { reason }

  referralAttached:(p = {}) => emit('referral_attached', p),
  referralFailed:  (p = {}) => emit('referral_attach_failed', p), // { reason }

  // ── Settings ──────────────────────────────────────────────────────────────
  settingsUpdated: (p = {}) => emit('settings_updated', p),  // { key, value }
  settingsRollback:(p = {}) => emit('settings_rollback', p),

  // ── Location / GPS ────────────────────────────────────────────────────────
  geoPermGranted:  (p = {}) => emit('geo_permission_granted',  p),
  geoPermDenied:   (p = {}) => emit('geo_permission_denied',   p),
  geoUnavailable:  (p = {}) => emit('geo_unavailable',         p),
  searchRouteFailed:(p= {}) => emit('search_on_route_failed',  p), // { reason }

  // ── Driver Registration ───────────────────────────────────────────────────
  driverRegSubmit: (p = {}) => emit('driver_reg_submit',       p),
  driverRegSuccess:(p = {}) => emit('driver_reg_success',      p),
  driverRegFailed: (p = {}) => emit('driver_reg_failed',       p), // { reason }
  docUploadSuccess:(p = {}) => emit('doc_upload_success',      p),
  docUploadFailed: (p = {}) => emit('doc_upload_failed',       p), // { doc_type, reason }

  // ── Push ─────────────────────────────────────────────────────────────────
  pushTokenSuccess:(p = {}) => emit('push_token_reg_success',  p),
  pushTokenFailed: (p = {}) => emit('push_token_reg_failed',   p), // { reason }
  pushTokenRefreshMismatch: (p = {}) => emit('push_token_refresh_mismatch', p),
};

export default telemetry;
