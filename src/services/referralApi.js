import { getJson, postJson } from './payments/paymentHttp.js';

export function getReferralSummary() {
  return getJson('/api/referral');
}

export function resolveReferralCode(code) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) {
    throw new Error('Referral code kerak');
  }
  return getJson(`/api/referral?action=resolve&code=${encodeURIComponent(normalizedCode)}`);
}

export function applyReferralCode({ code, device_hash }) {
  return postJson('/api/referral', {
    action: 'apply',
    code,
    device_hash: device_hash || null,
  });
}

const referralApi = {
  getReferralSummary,
  resolveReferralCode,
  applyReferralCode,
};

export default referralApi;
