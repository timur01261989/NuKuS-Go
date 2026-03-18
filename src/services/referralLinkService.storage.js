import { getSafeLocalStorage, normalizeReferralCode } from "./referralLinkService.helpers.js";

export const PENDING_REFERRAL_STORAGE_KEY = 'unigo_pending_referral_context_v1';
export const BROWSER_DEVICE_SEED_KEY = 'unigo_browser_device_seed_v1';
export const OWN_REFERRAL_SNAPSHOT_STORAGE_KEY = 'unigo_own_referral_snapshot_v1';

export function readStorageJson(key) {
  const storage = getSafeLocalStorage();
  if (!storage) return null;
  try {
    const rawValue = storage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

export function writeStorageJson(key, value) {
  const storage = getSafeLocalStorage();
  if (!storage) return null;
  storage.setItem(key, JSON.stringify(value));
  return value;
}

export function removeStorageKey(key) {
  const storage = getSafeLocalStorage();
  if (!storage) return;
  storage.removeItem(key);
}

export function normalizeOwnReferralSnapshot(snapshot) {
  const normalizedCode = normalizeReferralCode(snapshot?.code?.code || snapshot?.code || snapshot?.referral_code || '');
  if (!normalizedCode) return null;
  return {
    code: normalizedCode,
    share_url: String(snapshot?.share_url || snapshot?.shareUrl || '').trim(),
    wallet: snapshot?.wallet || null,
    summary: snapshot?.summary || null,
    saved_at: new Date().toISOString(),
  };
}
