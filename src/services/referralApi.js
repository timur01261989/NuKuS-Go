import { getJson, postJson } from './payments/paymentHttp.js';

export function getReferralSummary() {
  return getJson('/api/referral');
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
  applyReferralCode,
};

export default referralApi;
