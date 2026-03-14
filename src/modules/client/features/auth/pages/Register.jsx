import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import { supabase } from '@/services/supabase/supabaseClient';
import { useLanguage } from '@/modules/shared/i18n/useLanguage';
import { applyReferralCode, resolveReferralCode } from '@/services/referralApi.js';
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

  const handleVerifyOtp = useCallback(async (otpValue) => {
    const verificationCode = String(otpValue || '').replace(/\D/g, '').slice(0, 6);
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
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formData.fullPhone,
        token: verificationCode,
        type: 'sms',
      });
      if (error) throw error;

      const nextUser = data?.user;
      if (!nextUser?.id) {
        throw new Error(tr('register.unknownError', 'Noma’lum xatolik'));
      }

      const registrationTime = new Date().toISOString();
      const safeName = String(formData.name || '').trim() || tr('register.unknownName', 'Noma’lum');
      const safeSurname = String(formData.surname || '').trim() || tr('register.userSurnameFallback', 'Foydalanuvchi');
      const fullName = `${safeName} ${safeSurname}`.trim();

      const { error: updatePasswordError } = await supabase.auth.updateUser({ password: formData.password });
      if (updatePasswordError) throw updatePasswordError;

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: nextUser.id,
        full_name: fullName,
        phone: formData.fullPhone,
        phone_e164: formData.fullPhone,
        phone_normalized: formData.fullPhone,
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

      message.success(tr('register.success', 'Muvaffaqiyatli ro‘yxatdan o‘tdingiz!'));
      navigate('/', { replace: true });
    } catch (error) {
      message.error(String(error?.message || tr('register.unknownError', 'Noma’lum xatolik')));
    } finally {
      setLoading(false);
    }
  }, [formData, navigate, tr]);

  useEffect(() => {
    if (!('OTPCredential' in window)) return undefined;
    if (step !== 2 || !formData?.fullPhone) return undefined;

    const abortController = new AbortController();
    navigator.credentials
      .get({
        otp: { transport: ['sms'] },
        signal: abortController.signal,
      })
      .then((credential) => {
        if (!credential?.code) return;
        const nextOtp = String(credential.code).slice(0, 6);
        setOtp(nextOtp);
        void handleVerifyOtp(nextOtp);
      })
      .catch(() => {});

    return () => abortController.abort();
  }, [formData?.fullPhone, handleVerifyOtp, step]);

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
      // inline error only
    }
  }, [referralCode, validateReferral]);

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

    const normalizedReferralCode = normalizeReferralCode(referralCode);

    setLoading(true);
    try {
      if (normalizedReferralCode && (!referralStatus.valid || normalizedReferralCode !== normalizeReferralCode(getPendingReferralContext()?.code))) {
        await validateReferral(normalizedReferralCode);
      }

      const fullPhone = toFullPhone(localDigits);
      if (!fullPhone) {
        throw new Error(tr('phoneRequired', 'Telefon raqamni to‘liq kiriting (9 ta raqam).'));
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw error;

      setFormData({
        name: String(name || '').trim(),
        surname: String(surname || '').trim(),
        password,
        fullPhone,
        referralCode: normalizedReferralCode || '',
      });
      message.success(tr('smsSent', 'SMS kod yuborildi!'));
      setStep(2);
    } catch (error) {
      message.error(String(error?.message || tr('register.unknownError', 'Noma’lum xatolik')));
    } finally {
      setLoading(false);
    }
  }, [loading, name, password, phone, referralCode, referralStatus.valid, surname, tr, validateReferral]);

  const handleOtpChange = useCallback((event) => {
    setOtp(String(event.target.value || '').replace(/\D/g, '').slice(0, 6));
  }, []);

  const handleNameChange = useCallback((event) => {
    setName(event.target.value);
  }, []);

  const handleSurnameChange = useCallback((event) => {
    setSurname(event.target.value);
  }, []);

  const handlePhoneChange = useCallback((event) => {
    setPhone(normalizePhoneInput(event.target.value));
  }, []);

  const handlePasswordChange = useCallback((event) => {
    setPassword(event.target.value);
  }, []);

  const handleReferralChange = useCallback((event) => {
    const nextCode = normalizeReferralCode(event.target.value);
    setReferralCode(nextCode);
    setReferralStatus((current) => ({
      ...current,
      valid: false,
      inviter: null,
      error: '',
    }));
  }, []);

  const handleBackToForm = useCallback(() => {
    setStep(1);
    setOtp('');
  }, []);

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
    if (referralCode) {
      return tr('referral.optionalAtRegister', 'Referral kod faqat ro‘yxatdan o‘tish vaqtida qo‘llanadi.');
    }
    return tr('referral.optionalAtRegister', 'Referral kod faqat ro‘yxatdan o‘tish vaqtida qo‘llanadi.');
  }, [inviterName, referralCode, referralStatus.checking, referralStatus.error, referralStatus.valid, tr]);

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#E3EDF7] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[32px] p-8 bg-white/80 shadow-[20px_20px_60px_#c5d0da,-20px_-20px_60px_#ffffff] border border-white/60">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-5">{headerIcon}</div>
            <h1 className="text-4xl font-bold text-slate-900">UniGo</h1>
            <p className="mt-2 text-sm text-slate-500">{tr('register.smsSentInfo', 'SMS kodni kiriting')}</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-500 ml-1">{tr('register.smsCode', 'Tasdiqlash kodi')}</label>
              <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3">
                <input
                  value={otp}
                  onChange={handleOtpChange}
                  className="w-full bg-transparent outline-none text-center tracking-[0.5em] text-xl font-black text-slate-800 placeholder:text-slate-400"
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleVerifyOtp(otp)}
              disabled={loading}
              className="w-full rounded-2xl bg-[#ec5b13] text-white font-bold py-4 shadow-lg shadow-[#ec5b13]/20 hover:bg-[#d44d0a] active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {loading ? tr('loading', 'Yuklanmoqda...') : tr('register.confirm', 'Tasdiqlash')}
            </button>

            <button
              type="button"
              onClick={handleBackToForm}
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
                  onChange={handleNameChange}
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
                  onChange={handleSurnameChange}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                  placeholder={tr('register.surnamePlaceholder', 'Familiyangiz')}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 ml-1">{tr('phoneLabel', 'Telefon raqam')}</label>
              <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3 flex items-center">
                <span className="text-slate-600 font-semibold mr-2">+998</span>
                <input
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                  placeholder={tr('phonePlaceholder', '90 123 45 67')}
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
                  onChange={handlePasswordChange}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                  placeholder={tr('register.passwordPlaceholder', 'Parol yarating')}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-semibold text-slate-500 ml-1">{tr('referralCode', 'Taklif kodi')}</label>
                <button
                  type="button"
                  onClick={() => void handleReferralBlur()}
                  disabled={referralStatus.checking || !referralCode}
                  className="text-xs font-semibold text-[#ec5b13] disabled:opacity-50"
                >
                  {tr('checkPromo', 'Tekshirish')}
                </button>
              </div>
              <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3">
                <input
                  value={referralCode}
                  onChange={handleReferralChange}
                  onBlur={() => void handleReferralBlur()}
                  className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400 uppercase"
                  placeholder={tr('referral.optionalAtRegisterPlaceholder', 'Agar sizda taklif kodi bo‘lsa kiriting')}
                  autoComplete="off"
                />
              </div>
              <p className={`mt-2 text-xs ${referralStatus.error ? 'text-red-500' : referralStatus.valid ? 'text-green-600' : 'text-slate-500'}`}>
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
