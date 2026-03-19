import { getJson, postJson } from './payments/paymentHttp.js';

export function getReferralSummary() {
  return getJson('/api/referral');
}

export async function bootstrapReferralSummary() {
  try {
    // getJson may throw on network or non-2xx; catch and return structured error
    const res = await getJson('/api/referral?action=bootstrap');
    return res;
  } catch (err) {
    // Normalize error so frontend doesn't crash on thrown exception
    const message = err?.message || String(err) || 'Unknown error';
    console.warn('[referralApi] bootstrapReferralSummary failed', message);
    return { ok: false, error: message };
  }
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
  bootstrapReferralSummary,
  resolveReferralCode,
  applyReferralCode,
};

export default referralApi;
