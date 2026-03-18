/**
 * useRegisterController.js — Register sahifasi controller hooki
 * Register.jsx dagi barcha biznes logikani ajratadi.
 *
 * DOCX: Register.jsx → RegisterPage.jsx, useRegisterController.js, useRegisterOtp.js
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import { supabase } from '@/services/supabase/supabaseClient';
import { useLanguage } from '@/modules/shared/i18n/useLanguage';
import { sendSignupOtp, verifySignupOtp } from '@/services/otpService.js';
import { clientLogger } from '@/modules/shared/utils/clientLogger.js';
import { getErrorMessage } from '@/modules/shared/utils/errorAdapter.js';
import { attachReferralAfterRegister } from '@/services/referralAttachService.js';
import {
  getPendingReferralContext,
  hydratePendingReferralFromLocation,
  normalizeReferralCode,
  persistPendingReferralContext,
} from '@/services/referralLinkService.js';
import { resolveReferralCode } from '@/services/referralApi.js';
import { normalizePhoneInput, toFullPhone, buildFullName } from './register.helpers.js';
import { getReferralCodeFromSearch, normalizeOtpValue } from './register.logic.js';
import { buildProfileTrustState } from '../profileVerificationGuidance.js';
import { useAuthStateMachine } from './useAuthStateMachine.js';

export function useRegisterController() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tr } = useLanguage();
  const sm = useAuthStateMachine();

  const [step, setStep]           = useState(1);
  const [name, setName]           = useState('');
  const [surname, setSurname]     = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [otp, setOtp]             = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralStatus, setReferralStatus] = useState({
    checking: false, valid: false, inviter: null, error: '', source: 'manual',
  });
  const [otpMeta, setOtpMeta] = useState({
    resendCooldownSeconds: 60, expiresInSeconds: 180, cooldownLeft: 0,
  });
  const [formData, setFormData] = useState(null);

  // OTP countdown
  useEffect(() => {
    if (otpMeta.cooldownLeft <= 0) return;
    const id = setInterval(() => {
      setOtpMeta((prev) => ({ ...prev, cooldownLeft: Math.max(0, prev.cooldownLeft - 1) }));
    }, 1000);
    return () => clearInterval(id);
  }, [otpMeta.cooldownLeft]);

  // URL dan referral kodni olish
  useEffect(() => {
    const codeFromUrl = getReferralCodeFromSearch(searchParams);
    if (codeFromUrl) setReferralCode(codeFromUrl);
    const ctx = getPendingReferralContext();
    if (ctx?.code && !codeFromUrl) setReferralCode(ctx.code);
    hydratePendingReferralFromLocation(window.location);
  }, [searchParams]);

  const trustState = useMemo(
    () => buildProfileTrustState({ hasSelfie: step >= 2, hasDocument: Boolean(name || surname), profileScore: referralCode ? 80 : 55 }),
    [name, referralCode, step, surname],
  );

  // Referral kodni tekshirish
  const validateReferral = useCallback(async (code) => {
    const normalized = normalizeReferralCode(code);
    if (!normalized) return;
    setReferralStatus((p) => ({ ...p, checking: true, error: '' }));
    try {
      const result = await resolveReferralCode(normalized);
      setReferralStatus({ checking: false, valid: true, inviter: result?.inviter || null, error: '', source: 'validated' });
      persistPendingReferralContext({ code: normalized, source: 'validated' });
    } catch (err) {
      setReferralStatus({ checking: false, valid: false, inviter: null, error: getErrorMessage(err, 'Referral kod topilmadi'), source: 'manual' });
    }
  }, []);

  const handleReferralBlur = useCallback(async () => {
    const normalized = normalizeReferralCode(referralCode);
    if (!normalized) return;
    try { await validateReferral(normalized); } catch { /* inline */ }
  }, [referralCode, validateReferral]);

  // OTP so'rash
  const requestOtp = useCallback(async ({ nextName, nextSurname, nextLocalDigits, nextPassword, nextReferralCode }) => {
    const normalized = normalizeReferralCode(nextReferralCode);
    const fullPhone  = toFullPhone(nextLocalDigits);
    if (!fullPhone) throw new Error(tr('phoneRequired', 'Telefon raqamni to\'liq kiriting.'));

    sm.submit(fullPhone);
    const resp = await sendSignupOtp({
      phone: fullPhone, purpose: 'signup',
      firstName: String(nextName || '').trim(),
      lastName:  String(nextSurname || '').trim(),
      password: nextPassword,
      referralCode: normalized || '',
    });
    sm.otpSent();

    setFormData({ name: String(nextName||'').trim(), surname: String(nextSurname||'').trim(), password: nextPassword, fullPhone, referralCode: normalized || '' });
    setOtp('');
    setOtpMeta({
      resendCooldownSeconds: resp.resendCooldownSeconds,
      expiresInSeconds:      resp.expiresInSeconds,
      cooldownLeft:          resp.retryAfterSeconds > 0 ? resp.retryAfterSeconds : resp.resendCooldownSeconds,
    });
    message.success(String(resp.message || tr('smsSent', 'SMS kod yuborildi!')));
    setStep(2);
  }, [sm, tr]);

  const handleGetOtp = useCallback(async (e) => {
    e?.preventDefault?.();
    if (sm.isLoading) return;
    if (!String(name||'').trim())    { message.error(tr('register.nameRequired',     'Ismingizni kiriting.')); return; }
    if (!String(surname||'').trim()) { message.error(tr('register.surnameRequired',  'Familiyangizni kiriting.')); return; }
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 9)         { message.error(tr('phoneRequired',             'Telefon 9 ta raqam bo\'lishi kerak.')); return; }
    if (!password || password.length < 6) { message.error(tr('register.passwordMinLength', 'Parol kamida 6 ta belgi.')); return; }

    try {
      await requestOtp({ nextName: name, nextSurname: surname, nextLocalDigits: digits, nextPassword: password, nextReferralCode: referralCode });
    } catch (err) {
      sm.fail(err?.message);
      clientLogger.error('register.get_otp_failed', { message: err?.message });
      message.error(getErrorMessage(err, tr('register.unknownError', 'Noma\'lum xatolik')));
    }
  }, [sm, name, surname, phone, password, referralCode, requestOtp, tr]);

  const handleResendOtp = useCallback(async () => {
    if (sm.isLoading || !formData?.fullPhone) { if (!formData?.fullPhone) { message.error('Telefon topilmadi'); setStep(1); } return; }
    if (otpMeta.cooldownLeft > 0) { message.warning(`Kuting: ${otpMeta.cooldownLeft}s`); return; }
    const digits = formData.fullPhone.replace(/^\+998/, '');
    try {
      await requestOtp({ nextName: formData.name, nextSurname: formData.surname, nextLocalDigits: digits, nextPassword: formData.password, nextReferralCode: formData.referralCode });
    } catch (err) {
      sm.fail(err?.message);
      message.error(getErrorMessage(err, tr('register.unknownError', 'Noma\'lum xatolik')));
    }
  }, [sm, formData, otpMeta.cooldownLeft, requestOtp, tr]);

  const handleVerifyOtp = useCallback(async (otpValue) => {
    const code = normalizeOtpValue(otpValue || otp);
    if (code.length !== 6) { message.error(tr('register.codeMustBe6', 'Kod 6 ta raqam.')); return; }
    if (!formData?.fullPhone) { message.error('Telefon topilmadi'); setStep(1); return; }

    sm.verify();
    try {
      await verifySignupOtp({ phone: formData.fullPhone, otp: code, purpose: 'signup' });

      const regTime  = new Date().toISOString();
      const fullName = buildFullName(formData.name, formData.surname, tr);

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        phone: formData.fullPhone, password: formData.password,
        options: { data: { full_name: fullName, phone: formData.fullPhone } },
      });
      if (signUpErr) {
        if (String(signUpErr.message||'').toLowerCase().includes('already')) throw new Error(tr('register.phoneAlreadyExists', 'Bu telefon allaqachon mavjud.'));
        throw signUpErr;
      }

      let activeUser    = signUpData?.user    ?? null;
      let activeSession = signUpData?.session ?? null;
      if (!activeSession) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ phone: formData.fullPhone, password: formData.password });
        if (signInErr) throw signInErr;
        activeUser    = signInData?.user    ?? activeUser;
        activeSession = signInData?.session ?? null;
      }
      if (!activeUser?.id) throw new Error(tr('register.unknownError', 'Noma\'lum xatolik'));

      await supabase.from('profiles').upsert({
        id: activeUser.id, full_name: fullName,
        phone: formData.fullPhone, phone_normalized: formData.fullPhone,
        phone_verified: true, phone_verified_at: regTime,
        role: 'client', current_role: 'client', updated_at: regTime,
      }, { onConflict: 'id' });

      // Referral — DOCX: ajratilgan servis orqali
      await attachReferralAfterRegister({
        rawCode: formData.referralCode,
        onWarning: (msg) => message.warning(msg),
      });

      if (!activeSession) throw new Error(tr('register.sessionNotCreated', 'Sessiya yaratilmadi.'));

      sm.complete();
      message.success(tr('register.success', 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!'));
      navigate('/', { replace: true });
    } catch (err) {
      sm.fail(err?.message);
      clientLogger.error('register.verify_failed', { message: err?.message });
      message.error(getErrorMessage(err, tr('register.unknownError', 'Noma\'lum xatolik')));
    }
  }, [sm, formData, otp, tr, navigate]);

  return {
    step, name, surname, phone, password, otp, referralCode,
    referralStatus, otpMeta, trustState,
    loading: sm.isLoading,
    setName, setSurname,
    setPhone: (v) => setPhone(normalizePhoneInput(v)),
    setPassword, setOtp, setReferralCode,
    handleGetOtp, handleResendOtp, handleVerifyOtp, handleReferralBlur,
    navigate, tr,
  };
}
