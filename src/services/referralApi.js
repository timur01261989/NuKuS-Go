import { getJson, postJson } from './payments/paymentHttp.js';

async function safeApiCall(callFn, retries = 2, initialDelayMs = 250) {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= retries) {
    try {
      const result = await callFn();
      if (result?.ok === false) {
        throw new Error(result?.error || 'API returned error');
      }
      return result;
    } catch (error) {
      attempt += 1;
      if (attempt > retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  throw new Error('safeApiCall: unreachable');
}

export async function getReferralSummary() {
  try {
    const result = await safeApiCall(() => getJson('/api/referral'));
    return result;
  } catch (error) {
    console.warn('[referralApi] getReferralSummary failed', error?.message || error);
    return { ok: false, error: error?.message || 'Referral summary load failed' };
  }
}

export async function bootstrapReferralSummary() {
  try {
    const result = await safeApiCall(() => getJson('/api/referral?action=bootstrap'));
    return result;
  } catch (error) {
    console.warn('[referralApi] bootstrapReferralSummary failed', error?.message || error);
    return { ok: false, error: error?.message || 'Referral bootstrap failed' };
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
