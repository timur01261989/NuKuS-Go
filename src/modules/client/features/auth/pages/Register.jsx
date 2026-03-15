import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import { supabase } from '@/services/supabase/supabaseClient';
import { useLanguage } from '@/modules/shared/i18n/useLanguage';
import { applyReferralCode, resolveReferralCode } from '@/services/referralApi.js';
import { sendSignupOtp, verifySignupOtp } from '@/services/otpService.js';
import {
  clearPendingReferralContext,
  getPendingReferralContext,
  getReferralDeviceHash,
  hydratePendingReferralFromLocation,
  normalizeReferralCode,
  persistPendingReferralContext,
} from '@/services/referralLinkService.js';

function normalizePhoneInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 9);
  let out = digits;
  if (digits.length > 2) out = `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length > 5) out = `${out.slice(0, 6)} ${digits.slice(5)}`;
  if (digits.length > 7) out = `${out.slice(0, 9)} ${digits.slice(7)}`;
  return out;
}

function toFullPhone(localDigits) {
  const digits = String(localDigits || '').replace(/\D/g, '');
  if (digits.length !== 9) return null;
  return `+998${digits}`;
}

function buildFullName(name, surname, tr) {
  const safeName = String(name || '').trim() || tr('register.unknownName', 'Noma’lum');
  const safeSurname = String(surname || '').trim() || tr('register.userSurnameFallback', 'Foydalanuvchi');
  return `${safeName} ${safeSurname}`.trim();
}

function isAlreadyRegisteredMessage(input) {
  const messageText = String(input || '').toLowerCase();
  return messageText.includes('login qiling') || messageText.includes('allaqachon mavjud') || messageText.includes('ro‘yxatdan o‘tgansiz') || messageText.includes("ro'yxatdan o'tgansiz");
}

const Register = memo(function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tr } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otpMeta, setOtpMeta] = useState({
    resendCooldownSeconds: 60,
    expiresInSeconds: 180,
    cooldownLeft: 0,
  });
  const [referralStatus, setReferralStatus] = useState({
    checking: false,
    valid: false,
    inviter: null,
    error: '',
    source: 'manual',
  });
  const [formData, setFormData] = useState(null);

  const headerIcon = useMemo(
    () => (
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M13.13 2.188c-4.905 4.905-5.12 11.531-1.258 15.393.187.187.457.243.687.147.232-.096.381-.322.381-.572V14h3.13l.412-.412c.118-.118.188-.278.188-.447V10h2.188l.412-.412c.118-.118.188-.278.188-.447V7h1.412c.265 0 .52-.105.707-.293.188-.188.293-.442.293-.707V4.588c0-.53-.43-.96-.96-.96h-1.412c-.265 0-.52.105-.707.293L13.13 2.188z"
          fill="#ec5b13"
        />
        <circle cx="19.5" cy="1.5" r="1.5" fill="#ec5b13" fillOpacity="0.4" />
        <circle cx="22.5" cy="19.5" r="1.5" fill="#ec5b13" fillOpacity="0.2" />
        <path
          d="M21.07 14.232l-4.232-4.232c-.187-.187-.442-.293-.707-.293H14.12l-.412.412c-.118.118-.188.278-.188.447V12h-2.188l-.412.412c-.118.118-.188.278-.188.447v3.13h-3.131c-.25 0-.476.149-.572.381-.096.23-.04.5.147.687 3.862 3.862 10.488 3.647 15.393-1.258l-1.688-1.688c-.187-.187-.293-.442-.293-.707v-1.18z"
          fill="#ec5b13"
        />
      </svg>
    ),
    []
  );

  useEffect(() => {
    let mounted = true;
    const queryCode = normalizeReferralCode(searchParams.get('ref') || searchParams.get('referral') || '');
    const contextFromUrl = hydratePendingReferralFromLocation(window.location, { source: 'register-query' });
    const pendingContext = contextFromUrl || getPendingReferralContext();
    const initialCode = queryCode || pendingContext?.code || '';

    if (!mounted || !initialCode) {
      return () => {
        mounted = false;
      };
    }

    setReferralCode(initialCode);
    setReferralStatus((current) => ({
      ...current,
      source: pendingContext?.source || (queryCode ? 'register-query' : 'manual'),
    }));

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (step !== 2 || otpMeta.cooldownLeft <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setOtpMeta((current) => ({
        ...current,
        cooldownLeft: Math.max(current.cooldownLeft - 1, 0),
      }));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [otpMeta.cooldownLeft, step]);

  const validateReferral = useCallback(async (codeValue) => {
    const normalizedCode = normalizeReferralCode(codeValue);

    if (!normalizedCode) {
      setReferralStatus({
        checking: false,
        valid: false,
        inviter: null,
        error: '',
        source: 'manual',
      });
      return null;
    }

    setReferralStatus((current) => ({
      ...current,
      checking: true,
      error: '',
    }));

    try {
      const response = await resolveReferralCode(normalizedCode);
      persistPendingReferralContext({
        code: response?.code?.code || normalizedCode,
        source: referralStatus.source || 'register',
        inviter: response?.inviter || null,
      });
      setReferralStatus({
        checking: false,
        valid: true,
        inviter: response?.inviter || null,
        error: '',
        source: referralStatus.source || 'register',
      });
      return response;
    } catch (error) {
      const errorMessage = String(error?.message || tr('referral.invalidLink', 'Referral kod topilmadi.'));
      setReferralStatus({
        checking: false,
        valid: false,
        inviter: null,
        error: errorMessage,
        source: referralStatus.source || 'manual',
      });
      throw new Error(errorMessage);
    }
  }, [referralStatus.source, tr]);

  const handleReferralBlur = useCallback(async () => {
    const normalizedCode = normalizeReferralCode(referralCode);
    if (!normalizedCode) {
      setReferralStatus({
        checking: false,
        valid: false,
        inviter: null,
        error: '',
        source: 'manual',
      });
      clearPendingReferralContext();
      return;
    }

    try {
      await validateReferral(normalizedCode);
    } catch {
      // inline validation is enough
    }
  }, [referralCode, validateReferral]);

  const requestOtp = useCallback(async ({
    nextName,
    nextSurname,
    nextLocalDigits,
    nextPassword,
    nextReferralCode,
  }) => {
    const normalizedReferralCode = normalizeReferralCode(nextReferralCode);

    if (normalizedReferralCode && (!referralStatus.valid || normalizedReferralCode !== normalizeReferralCode(getPendingReferralContext()?.code))) {
      await validateReferral(normalizedReferralCode);
    }

    const fullPhone = toFullPhone(nextLocalDigits);
    if (!fullPhone) {
      throw new Error(tr('phoneRequired', 'Telefon raqamni to‘liq kiriting (9 ta raqam).'));
    }

    const otpResponse = await sendSignupOtp({
      phone: fullPhone,
      purpose: 'signup',
    });

    setFormData({
      name: String(nextName || '').trim(),
      surname: String(nextSurname || '').trim(),
      password: nextPassword,
      fullPhone,
      referralCode: normalizedReferralCode || '',
    });
    setOtp('');
    setOtpMeta({
      resendCooldownSeconds: otpResponse.resendCooldownSeconds,
      expiresInSeconds: otpResponse.expiresInSeconds,
      cooldownLeft: otpResponse.retryAfterSeconds > 0
        ? otpResponse.retryAfterSeconds
        : otpResponse.resendCooldownSeconds,
    });
    message.success(String(otpResponse.message || tr('smsSent', 'SMS kod yuborildi!')));
    setStep(2);
  }, [referralStatus.valid, tr, validateReferral]);

  const handleGetOtp = useCallback(async (event) => {
    event.preventDefault();
    if (loading) return;

    const localDigits = phone.replace(/\D/g, '');
    if (!String(name || '').trim()) {
      message.error(tr('register.nameRequired', 'Ismingizni kiriting.'));
      return;
    }
    if (!String(surname || '').trim()) {
      message.error(tr('register.surnameRequired', 'Familiyangizni kiriting.'));
      return;
    }
    if (localDigits.length !== 9) {
      message.error(tr('phoneRequired', 'Telefon raqamni to‘liq kiriting (9 ta raqam).'));
      return;
    }
    if (!password || password.length < 6) {
      message.error(tr('register.passwordMinLength', 'Parol kamida 6 ta belgidan iborat bo‘lsin.'));
      return;
    }

    setLoading(true);
    try {
      await requestOtp({
        nextName: name,
        nextSurname: surname,
        nextLocalDigits: localDigits,
        nextPassword: password,
        nextReferralCode: referralCode,
      });
    } catch (error) {
      const errorMessage = String(error?.message || tr('register.unknownError', 'Noma’lum xatolik'));
      if (isAlreadyRegisteredMessage(errorMessage)) {
        message.warning(errorMessage);
        navigate('/login', { replace: true, state: { suggestedPhone: localDigits } });
        return;
      }
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loading, name, navigate, password, phone, referralCode, requestOtp, surname, tr]);

  const handleResendOtp = useCallback(async () => {
    if (loading) return;
    if (!formData?.fullPhone) {
      message.error(tr('register.phoneNotFoundRetry', 'Telefon raqam topilmadi. Qaytadan urinib ko‘ring.'));
      setStep(1);
      return;
    }
    if (otpMeta.cooldownLeft > 0) {
      message.warning(`${tr('register.waitBeforeResend', 'Qayta yuborish uchun kuting')}: ${otpMeta.cooldownLeft}s`);
      return;
    }

    setLoading(true);
    try {
      const localDigits = formData.fullPhone.replace(/^\+998/, '');
      await requestOtp({
        nextName: formData.name,
        nextSurname: formData.surname,
        nextLocalDigits: localDigits,
        nextPassword: formData.password,
        nextReferralCode: formData.referralCode,
      });
    } catch (error) {
      const errorMessage = String(error?.message || tr('register.unknownError', 'Noma’lum xatolik'));
      if (isAlreadyRegisteredMessage(errorMessage)) {
        message.warning(errorMessage);
        navigate('/login', { replace: true, state: { suggestedPhone: formData.fullPhone.replace(/^\+998/, '') } });
        return;
      }
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, loading, navigate, otpMeta.cooldownLeft, requestOtp, tr]);

  const handleVerifyOtp = useCallback(async (otpValue) => {
    const verificationCode = String(otpValue || otp).replace(/\D/g, '').slice(0, 6);
    if (verificationCode.length !== 6) {
      message.error(tr('register.codeMustBe6', 'Kod 6 ta raqam bo‘lishi kerak.'));
      return;
    }
    if (!formData?.fullPhone) {
      message.error(tr('register.phoneNotFoundRetry', 'Telefon raqam topilmadi. Qaytadan urinib ko‘ring.'));
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      await verifySignupOtp({
        phone: formData.fullPhone,
        otp: verificationCode,
        purpose: 'signup',
      });

      const registrationTime = new Date().toISOString();
      const fullName = buildFullName(formData.name, formData.surname, tr);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        phone: formData.fullPhone,
        password: formData.password,
        options: {
          data: {
            full_name: fullName,
            phone: formData.fullPhone,
          },
        },
      });

      if (signUpError) {
        const signUpMessage = String(signUpError.message || 'Ro‘yxatdan o‘tishda xato yuz berdi.');
        if (signUpMessage.toLowerCase().includes('already')) {
          throw new Error(tr('register.phoneAlreadyExists', 'Bu telefon raqam bilan ro‘yxatdan o‘tgansiz. Iltimos, login qiling.'));
        }
        throw signUpError;
      }

      let nextUser = signUpData?.user ?? null;
      let activeSession = signUpData?.session ?? null;

      if (!activeSession) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          phone: formData.fullPhone,
          password: formData.password,
        });
        if (signInError) throw signInError;
        nextUser = signInData?.user ?? nextUser;
        activeSession = signInData?.session ?? null;
      }

      if (!nextUser?.id) {
        throw new Error(tr('register.unknownError', 'Noma’lum xatolik'));
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: nextUser.id,
        full_name: fullName,
        phone: formData.fullPhone,
        phone_normalized: formData.fullPhone,
        phone_verified: true,
        phone_verified_at: registrationTime,
        role: 'client',
        current_role: 'client',
        is_test_user: false,
        created_at: registrationTime,
        updated_at: registrationTime,
        last_login: registrationTime,
      }, { onConflict: 'id' });
      if (profileError) throw profileError;

      const normalizedReferralCode = normalizeReferralCode(formData.referralCode || '');
      if (normalizedReferralCode) {
        try {
          const deviceHash = await getReferralDeviceHash();
          await applyReferralCode({
            code: normalizedReferralCode,
            device_hash: deviceHash,
          });
          clearPendingReferralContext();
        } catch (referralError) {
          message.warning(String(referralError?.message || tr('referral.applyWarning', 'Referral kod saqlanmadi. Keyinroq tekshiring.')));
        }
      } else {
        clearPendingReferralContext();
      }

      if (!activeSession) {
        throw new Error(tr('register.sessionNotCreated', 'Sessiya yaratilmadi. Qayta kirib ko‘ring.'));
      }

      message.success(tr('register.success', 'Muvaffaqiyatli ro‘yxatdan o‘tdingiz!'));
      navigate('/', { replace: true });
    } catch (error) {
      const errorMessage = String(error?.message || tr('register.unknownError', 'Noma’lum xatolik'));
      if (isAlreadyRegisteredMessage(errorMessage)) {
        message.warning(errorMessage);
        navigate('/login', { replace: true, state: { suggestedPhone: formData?.fullPhone?.replace(/^\+998/, '') || '' } });
        return;
      }
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, navigate, otp, tr]);

  const inviterName = useMemo(() => {
    return String(referralStatus.inviter?.full_name || '').trim();
  }, [referralStatus.inviter?.full_name]);

  const referralHelperText = useMemo(() => {
    if (referralStatus.checking) {
      return tr('loading', 'Yuklanmoqda...');
    }
    if (referralStatus.error) {
      return referralStatus.error;
    }
    if (referralStatus.valid && inviterName) {
      return `${tr('referral.inviterLabel', 'Taklif qiluvchi')}: ${inviterName}`;
    }
    return tr('referral.optionalAtRegister', 'Referral kod faqat ro‘yxatdan o‘tish vaqtida qo‘llanadi.');
  }, [inviterName, referralStatus.checking, referralStatus.error, referralStatus.valid, tr]);

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#E3EDF7] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[32px] p-8 bg-white/80 shadow-[20px_20px_60px_#c5d0da,-20px_-20px_60px_#ffffff] border border-white/60">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-5">{headerIcon}</div>
            <h1 className="text-4xl font-bold text-slate-900">UniGo</h1>
            <p className="mt-2 text-sm text-slate-500">{tr('register.smsSentInfo', 'SMS kodni kiriting')}</p>
            <p className="mt-1 text-xs text-slate-500">{formData?.fullPhone}</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-500 ml-1">{tr('register.smsCode', 'Tasdiqlash kodi')}</label>
              <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3">
                <input
                  value={otp}
                  onChange={(event) => setOtp(String(event.target.value || '').replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-transparent outline-none text-center tracking-[0.5em] text-xl font-black text-slate-800 placeholder:text-slate-400"
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {tr('register.codeExpiresIn', 'Kod amal qilish vaqti')}: {otpMeta.expiresInSeconds}s
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleVerifyOtp()}
              disabled={loading}
              className="w-full rounded-2xl bg-[#ec5b13] text-white font-bold py-4 shadow-lg shadow-[#ec5b13]/20 hover:bg-[#d44d0a] active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {loading ? tr('loading', 'Yuklanmoqda...') : tr('register.confirm', 'Tasdiqlash')}
            </button>

            <button
              type="button"
              onClick={() => void handleResendOtp()}
              disabled={loading || otpMeta.cooldownLeft > 0}
              className="w-full rounded-2xl bg-white text-slate-700 font-semibold py-4 border border-slate-200 hover:bg-slate-50 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {otpMeta.cooldownLeft > 0
                ? `${tr('register.waitBeforeResend', 'Qayta yuborish uchun kuting')} ${otpMeta.cooldownLeft}s`
                : tr('register.resendCode', 'Kodni qayta yuborish')}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full rounded-2xl bg-white text-slate-700 font-semibold py-4 border border-slate-200 hover:bg-slate-50 active:scale-[0.99] transition-all"
            >
              {tr('back', 'Orqaga')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E3EDF7] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="mb-6">{headerIcon}</div>
          <h1 className="text-5xl font-bold text-[#1e293b] tracking-tight">UniGo</h1>
          <p className="text-[#ec5b13] font-medium mt-1 text-base">{tr('register.createAccountTitle', 'Yangi hisob yaratish')}</p>
        </div>

        <div className="rounded-[32px] p-8 bg-white/80 shadow-[20px_20px_60px_#c5d0da,-20px_-20px_60px_#ffffff] border border-white/60">
          <div className="flex items-center justify-between mb-8">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-12 h-12 rounded-2xl bg-[#E3EDF7] shadow-[8px_8px_16px_#ccd4dc,-8px_-8px_16px_#ffffff] flex items-center justify-center active:scale-95 transition-transform"
              aria-label={tr('back', 'Orqaga')}
            >
              <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-slate-800 tracking-wide">{tr('register', 'Ro‘yxatdan o‘tish')}</h2>
            <div className="w-12 h-12" />
          </div>

          <form className="space-y-5" onSubmit={handleGetOtp}>
            <div>
              <label className="text-xs font-semibold text-slate-500 ml-1">{tr('name', 'Ism')}</label>
              <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                  placeholder={tr('register.namePlaceholder', 'Ismingiz')}
                  autoComplete="given-name"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 ml-1">{tr('surname', 'Familiya')}</label>
              <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3">
                <input
                  value={surname}
                  onChange={(event) => setSurname(event.target.value)}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                  placeholder={tr('register.surnamePlaceholder', 'Familiyangiz')}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 ml-1">{tr('phone', 'Telefon')}</label>
              <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3 flex items-center gap-3">
                <span className="font-semibold text-slate-600">+998</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(normalizePhoneInput(event.target.value))}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                  placeholder="90 123 45 67"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 ml-1">{tr('password', 'Parol')}</label>
              <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                  placeholder={tr('register.passwordPlaceholder', 'Parol yarating')}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 ml-1">{tr('referral.codeLabel', 'Referral kod (ixtiyoriy)')}</label>
              <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3">
                <input
                  value={referralCode}
                  onChange={(event) => setReferralCode(String(event.target.value || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32))}
                  onBlur={() => void handleReferralBlur()}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400 uppercase"
                  placeholder={tr('referral.codePlaceholder', 'Referral kod')}
                  autoComplete="off"
                />
              </div>
              <p className={`mt-2 text-xs ${referralStatus.error ? 'text-red-500' : referralStatus.valid ? 'text-emerald-600' : 'text-slate-500'}`}>
                {referralHelperText}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#ec5b13] text-white font-bold py-4 shadow-lg shadow-[#ec5b13]/20 hover:bg-[#d44d0a] active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {loading ? tr('loading', 'Yuklanmoqda...') : tr('register.getCode', 'SMS kod olish')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
});

export default Register;
