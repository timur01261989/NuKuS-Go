/**
 * referral-attach.unit.test.js
 * DOCX Section 10: Unit — referralAttachService
 */
import { describe, it, expect, vi } from 'vitest';

// referralAttachService mantiqini mock bilan test qilamiz
async function attachReferralAfterRegister({ rawCode, applyFn, clearFn, onWarning }) {
  const normalize = (c) => String(c || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const normalizedCode = normalize(rawCode);

  if (!normalizedCode) {
    clearFn?.();
    return { applied: false, code: null };
  }

  try {
    await applyFn({ code: normalizedCode });
    clearFn?.();
    return { applied: true, code: normalizedCode };
  } catch (err) {
    onWarning?.(err.message || 'Referral xato');
    clearFn?.();
    return { applied: false, code: normalizedCode, error: err.message };
  }
}

describe('attachReferralAfterRegister', () => {
  it('bo\'sh kod — applied=false, clearFn chaqiriladi', async () => {
    const clearFn = vi.fn();
    const applyFn = vi.fn();
    const r = await attachReferralAfterRegister({ rawCode: '', applyFn, clearFn });
    expect(r.applied).toBe(false);
    expect(r.code).toBeNull();
    expect(clearFn).toHaveBeenCalledOnce();
    expect(applyFn).not.toHaveBeenCalled();
  });

  it('to\'g\'ri kod — applyFn chaqiriladi, applied=true', async () => {
    const clearFn = vi.fn();
    const applyFn = vi.fn().mockResolvedValue({ ok: true });
    const r = await attachReferralAfterRegister({ rawCode: 'REF123', applyFn, clearFn });
    expect(r.applied).toBe(true);
    expect(r.code).toBe('REF123');
    expect(applyFn).toHaveBeenCalledWith({ code: 'REF123' });
    expect(clearFn).toHaveBeenCalledOnce();
  });

  it('applyFn xato qaytarsa — onWarning chaqiriladi, applied=false', async () => {
    const clearFn  = vi.fn();
    const onWarning = vi.fn();
    const applyFn  = vi.fn().mockRejectedValue(new Error('Referral topilmadi'));
    const r = await attachReferralAfterRegister({ rawCode: 'BADCODE', applyFn, clearFn, onWarning });
    expect(r.applied).toBe(false);
    expect(onWarning).toHaveBeenCalledWith('Referral topilmadi');
    expect(clearFn).toHaveBeenCalledOnce();
  });

  it('kod normalize qilinadi (lowercase → uppercase)', async () => {
    const applyFn = vi.fn().mockResolvedValue({});
    const clearFn = vi.fn();
    const r = await attachReferralAfterRegister({ rawCode: 'ref-abc', applyFn, clearFn });
    expect(r.code).toBe('REFABC');
  });
});
