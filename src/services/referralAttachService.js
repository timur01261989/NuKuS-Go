/**
 * referralAttachService.js — Referral kodni ro'yxatdan o'tishda qo'llash
 *
 * DOCX tavsiyasi: Referral attach logikasini page'dan services/referralAttachService.js ga ko'chirish
 *
 * Avval bu logika Register.jsx ning ichida edi — regressiya xavfi yuqori edi.
 * Endi alohida servis — test qilish oson, Register.jsx yengilroq.
 */
import { applyReferralCode } from '@/services/referralApi.js';
import {
  clearPendingReferralContext,
  getReferralDeviceHash,
  normalizeReferralCode,
} from '@/services/referralLinkService.js';
import { clientLogger } from '@/modules/shared/utils/clientLogger.js';
import { getErrorMessage } from '@/modules/shared/utils/errorAdapter.js';

/**
 * Referral kodni foydalanuvchi ro'yxatdan o'tgandan keyin qo'llaydi.
 *
 * @param {object} params
 * @param {string} params.rawCode       — Foydalanuvchi kiritgan yoki URL dan olingan kod
 * @param {Function} [params.onWarning] — Muvaffaqiyatsiz bo'lsa warning callback (message.warning)
 * @returns {Promise<{applied: boolean, code: string|null}>}
 */
export async function attachReferralAfterRegister({ rawCode, onWarning }) {
  const normalizedCode = normalizeReferralCode(rawCode || '');

  if (!normalizedCode) {
    clearPendingReferralContext();
    return { applied: false, code: null };
  }

  try {
    const deviceHash = await getReferralDeviceHash();
    await applyReferralCode({ code: normalizedCode, device_hash: deviceHash });
    clearPendingReferralContext();
    return { applied: true, code: normalizedCode };
  } catch (err) {
    clientLogger.warn('referralAttachService.apply_failed', { message: err?.message });
    const warnMsg = getErrorMessage(err, 'Referral kod saqlanmadi. Keyinroq tekshiring.');
    onWarning?.(warnMsg);
    clearPendingReferralContext();
    return { applied: false, code: normalizedCode, error: warnMsg };
  }
}
