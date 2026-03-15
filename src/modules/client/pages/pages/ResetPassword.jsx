import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  resetPasswordWithOtp,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
} from '@/services/otpService.js';
import { usePageI18n } from './pageI18n';

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

function calcStrength(password) {
  let score = 0;
  if (password.length >= 6) score += 30;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 10;
  return Math.min(score, 100);
}

const ResetPassword = memo(function ResetPassword() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [fullPhone, setFullPhone] = useState('');
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [expiresInSeconds, setExpiresInSeconds] = useState(180);

  const navigate = useNavigate();
  const { t, tx } = usePageI18n();

  useEffect(() => {
    if (step !== 2 || cooldownLeft <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCooldownLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [cooldownLeft, step]);

  const strengthLabel = useCallback((score) => {
    if (score < 45) return tx('veryWeak', 'Juda kuchsiz');
    if (score < 75) return tx('medium', 'O‘rtacha');
    return tx('strongPassword', 'Kuchli parol');
  }, [tx]);

  const passwordHelper = useMemo(() => {
    if (passwordStrength <= 0) return '';
    return strengthLabel(passwordStrength);
  }, [passwordStrength, strengthLabel]);

  const handleSendCode = useCallback(async (event) => {
    event.preventDefault();
    if (loading) return;

    const localDigits = phone.replace(/\D/g, '');
    if (localDigits.length !== 9) {
      message.error(tx('enterPhoneFull', 'Telefon raqamni to‘liq kiriting.'));
      return;
    }

    const nextFullPhone = toFullPhone(localDigits);
    if (!nextFullPhone) {
      message.error(tx('enterPhoneFull', 'Telefon raqamni to‘liq kiriting.'));
      return;
    }

    setLoading(true);
    try {
      const response = await sendPasswordResetOtp({ phone: nextFullPhone });
      setFullPhone(nextFullPhone);
      setSmsCode('');
      setExpiresInSeconds(response.expiresInSeconds);
      setCooldownLeft(response.retryAfterSeconds > 0 ? response.retryAfterSeconds : response.resendCooldownSeconds);
      setStep(2);
      message.success(String(response.message || tx('smsSent', 'SMS kod yuborildi!')));
    } catch (error) {
      message.error(String(error?.message || tx('smsSentError', 'SMS yuborishda xatolik yuz berdi.')));
    } finally {
      setLoading(false);
    }
  }, [loading, phone, tx]);

  const handleResendCode = useCallback(async () => {
    if (loading) return;
    if (!fullPhone) {
      message.error(tx('enterPhoneFirst', 'Avval telefon raqamni kiriting.'));
      setStep(1);
      return;
    }
    if (cooldownLeft > 0) {
      message.warning(`${tx('waitBeforeResend', 'Qayta yuborish uchun kuting')} ${cooldownLeft}s`);
      return;
    }

    setLoading(true);
    try {
      const response = await sendPasswordResetOtp({ phone: fullPhone });
      setExpiresInSeconds(response.expiresInSeconds);
      setCooldownLeft(response.retryAfterSeconds > 0 ? response.retryAfterSeconds : response.resendCooldownSeconds);
      message.success(String(response.message || tx('smsSent', 'SMS kod yuborildi!')));
    } catch (error) {
      message.error(String(error?.message || tx('smsSentError', 'SMS yuborishda xatolik yuz berdi.')));
    } finally {
      setLoading(false);
    }
  }, [cooldownLeft, fullPhone, loading, tx]);

  const handleFinish = useCallback(async (event) => {
    event.preventDefault();
    if (loading) return;

    const normalizedOtp = String(smsCode || '').replace(/\D/g, '').slice(0, 6);
    if (!fullPhone) {
      message.error(tx('enterPhoneFirst', 'Avval telefon raqamni kiriting.'));
      setStep(1);
      return;
    }
    if (normalizedOtp.length !== 6) {
      message.error(tx('codeMustBe6', 'SMS kod 6 ta raqam bo‘lishi kerak.'));
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      message.error(tx('passwordMin6', 'Parol kamida 6 ta belgidan iborat bo‘lsin.'));
      return;
    }
    if (newPassword !== confirm) {
      message.error(tx('passMismatch', 'Parollar bir xil emas.'));
      return;
    }

    setLoading(true);
    try {
      await verifyPasswordResetOtp({
        phone: fullPhone,
        otp: normalizedOtp,
      });

      await resetPasswordWithOtp({
        phone: fullPhone,
        newPassword,
      });

      message.success(tx('successPass', 'Parol muvaffaqiyatli yangilandi. Endi login qiling.'));
      navigate('/login', {
        replace: true,
        state: {
          suggestedPhone: fullPhone.replace(/^\+998/, ''),
        },
      });
    } catch (error) {
      message.error(String(error?.message || tx('unknownError', 'Noma’lum xatolik.')));
    } finally {
      setLoading(false);
    }
  }, [confirm, fullPhone, loading, navigate, newPassword, smsCode, tx]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100 p-4">
      <main className="w-full max-w-sm">
        <header className="text-center mb-8 relative">
          <button
            type="button"
            onClick={() => (step === 2 ? setStep(1) : navigate('/login'))}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/60 hover:bg-white/80 border border-white/30"
            aria-label={tx('backAria', 'Back')}
          >
            <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="inline-flex items-center justify-center w-20 h-20 bg-unigo-primary rounded-2xl shadow-lg mb-4 transform -rotate-2 mx-auto">
            <span className="text-white text-3xl font-black tracking-tighter">UG</span>
          </div>
          <h1 className="text-3xl font-extrabold text-unigo-dark tracking-tight">{tx('appName', 'UniGo')}</h1>
          <p className="text-unigo-accent font-semibold tracking-wide uppercase text-xs mt-1">{tx('resetTitle', 'Parolni tiklash').toUpperCase()}</p>
        </header>

        <section className="rounded-3xl p-8 shadow-modern bg-white/90 backdrop-blur border border-white/20">
          {step === 1 ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">{tx('resetTitle', 'Parolni tiklash')}</h2>
              <p className="text-gray-500 text-sm text-center mb-6">{tx('enterPhone', 'Telefon raqamingizni kiriting')}</p>

              <form className="space-y-5" onSubmit={handleSendCode}>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">{tx('phoneLabel', 'Telefon')}</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-400 font-medium">+998</span>
                    <input
                      value={phone}
                      onChange={(event) => setPhone(normalizePhoneInput(event.target.value))}
                      className="w-full pl-16 pr-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all text-gray-700"
                      placeholder={tx('phonePlaceholder', '90 123 45 67')}
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-unigo-primary hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? tx('sending', 'Yuborilmoqda...') : tx('sendCode', 'SMS kod yuborish')}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">{tx('resetTitle', 'Parolni tiklash')}</h2>
              <p className="text-gray-500 text-sm text-center mb-2">{tx('enterSms', 'SMS kod va yangi parolni kiriting')}</p>
              <p className="text-xs text-gray-500 text-center mb-6">{fullPhone}</p>

              <form className="space-y-5" onSubmit={handleFinish}>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">{tx('smsCode', 'SMS kod')}</label>
                  <input
                    value={smsCode}
                    onChange={(event) => setSmsCode(String(event.target.value).replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all text-gray-700 text-center text-3xl font-extrabold tracking-[0.5em]"
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2">
                    <span>{tx('codeExpiresIn', 'Kod amal qilish vaqti')}: {expiresInSeconds}s</span>
                    {cooldownLeft > 0 ? <span>{tx('waitBeforeResend', 'Qayta yuborish uchun kuting')} {cooldownLeft}s</span> : null}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">{tx('newPassword', 'Yangi parol')}</label>
                  <input
                    value={newPassword}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setNewPassword(nextValue);
                      setPasswordStrength(calcStrength(nextValue));
                    }}
                    className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all text-gray-700"
                    placeholder={tx('newPassword', 'Yangi parol')}
                    type="password"
                    autoComplete="new-password"
                  />
                  {passwordStrength > 0 ? (
                    <div className="pt-2">
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-2 bg-unigo-accent transition-all" style={{ width: `${passwordStrength}%` }} />
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1">{passwordHelper}</div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">{tx('confirmPassword', 'Parolni tasdiqlang')}</label>
                  <input
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all text-gray-700"
                    placeholder={tx('confirmPassword', 'Parolni tasdiqlang')}
                    type="password"
                    autoComplete="new-password"
                  />
                </div>

                <button type="submit" disabled={loading} className="w-full bg-unigo-primary hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? tx('saving', 'Saqlanmoqda...') : tx('save', 'Saqlash')}
                </button>

                <button type="button" onClick={() => void handleResendCode()} disabled={loading || cooldownLeft > 0} className="w-full text-center text-gray-500 text-sm font-semibold hover:underline disabled:opacity-50">
                  {cooldownLeft > 0 ? `${tx('waitBeforeResend', 'Qayta yuborish uchun kuting')} ${cooldownLeft}s` : tx('resendCode', 'Kodni qayta yuborish')}
                </button>

                <button type="button" onClick={() => setStep(1)} className="w-full text-center text-gray-500 text-sm font-semibold hover:underline">
                  {tx('back', 'Orqaga')}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
});

export default ResetPassword;
