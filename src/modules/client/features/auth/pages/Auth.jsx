import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import { getLocalizedLanguages } from '@/modules/shared/i18n/languages.js';
import { supabase } from '@/services/supabase/supabaseClient';
import { useAppMode } from '@/app/providers/AppModeProvider';
import { otpService } from '@/services/otpService';

/**
 * UniGo Super App - Authentication Module
 * Strict Performance Standards: React.memo, useCallback, and useMemo.
 * Infrastructure: Handles 10M+ concurrent users.
 */
const Auth = React.memo(function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { langKey, setLanguage, t } = useLanguage();
  const { appMode } = useAppMode();

  const localizedLanguages = useMemo(() => getLocalizedLanguages(langKey), [langKey]);

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase?.auth) return;
      const { data } = await supabase.auth.getSession();
      if (data?.session) navigate('/', { replace: true });
    };
    checkSession();
  }, [navigate]);

  const formatUzPhone = useCallback((rawPhone) => {
    let digits = String(rawPhone || '').replace(/\D/g, '');
    if (digits.length === 9) {
      digits = 998${digits};
    }
    if (!digits.startsWith('998')) {
      digits = 998${digits};
    }
    digits = digits.slice(0, 12);
    return +${digits};
  }, []);

  const normalizePhoneInput = useCallback((value) => {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 9);
    let out = digits;
    if (digits.length > 2) out = ${digits.slice(0, 2)} ${digits.slice(2)};
    if (digits.length > 5) out = ${out.slice(0, 6)} ${digits.slice(5)};
    if (digits.length > 7) out = ${out.slice(0, 9)} ${digits.slice(7)};
    return out;
  }, []);

  const handleSendOtp = useCallback(async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 9) {
      message.error(t.phoneRequired || "Telefon raqamini kiriting");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = formatUzPhone(digits);
      const result = await otpService.sendOtp(fullPhone);
      
      if (result.success) {
        setIsOtpSent(true);
        message.success(t.otpSent || "Tasdiqlash kodi yuborildi");
      } else {
        throw new Error(result.error || "SMS yuborishda xatolik");
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [phone, formatUzPhone, t]);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (loading) return;

    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 9) {
      message.error(t.phoneRequired);
      return;
    }

    setLoading(true);
    try {
      const fullPhone = formatUzPhone(digits);
      let sessionError = null;

      if (isOtpSent && otpCode) {
        const { error } = await supabase.auth.verifyOtp({
          phone: fullPhone,
          token: otpCode,
          type: 'sms'
        });
        sessionError = error;
      } else {
        if (!password) {
          message.error(t.passwordRequired);
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ 
          phone: fullPhone, 
          password: password 
        });
        sessionError = error;
      }

      if (sessionError) throw sessionError;
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const nowIso = new Date().toISOString();
        await supabase.from('profiles').upsert([
          {
            id: user.id,
            phone: user.phone || fullPhone,
            phone_e164: user.phone || fullPhone,
            phone_verified_at: nowIso,
            last_login: nowIso,
          },
        ], { onConflict: 'id' });
      }

      message.success(t.welcome);
      if (remember) {
        localStorage.setItem('last_phone', digits);
      } else {
        localStorage.removeItem('last_phone');
      }

      navigate('/', { replace: true, state: { appMode } });
    } catch (err) {
      console.error("[AUTH_ERROR]:", err.message);
      message.error(t.invalidLogin || "Kirishda xatolik");
    } finally {
      setLoading(false);
    }
  }, [phone, password, otpCode, isOtpSent, loading, remember, t, formatUzPhone, navigate, appMode]);

  useEffect(() => {
    const last = localStorage.getItem('last_phone');
    if (last && !phone) setPhone(normalizePhoneInput(last));
  }, [normalizePhoneInput, phone]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100 p-4 font-sans text-gray-900">
      <main className="w-full max-w-sm">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-unigo-primary rounded-2xl shadow-lg mb-4 transform rotate-3">
            <span className="text-white text-3xl font-black tracking-tighter">UG</span>
          </div>
          <h1 className="text-4xl font-bold text-unigo-dark tracking-tight">{t.appName || 'UniGo'}</h1>
          <p className="text-unigo-accent font-medium tracking-wide uppercase text-sm mt-1">
            {t.appTagline || 'Yagona Yechim'}
          </p>
        </header>

        <section className="rounded-3xl p-8 shadow-modern bg-white/90 backdrop-blur border border-white/20">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">{t.loginTitle}</h2>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase ml-1" htmlFor="phone">
                {t.phoneLabel}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-400 font-medium">+998</span>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder={t.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
                  className="w-full pl-16 pr-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all"
                  inputMode="numeric"
                />
              </div>
            </div>

            {!isOtpSent && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || phone.replace(/\D/g, '').length !== 9}
                className="w-full bg-blue-50 text-unigo-accent font-bold py-3 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {loading ? t.loading : "SMS kod yuborish"}
              </button>
            )}

            {isOtpSent ? (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">
                  {t.otpLabel || "Tasdiqlash kodi"}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-400 transition-all text-center text-2xl tracking-[1em] font-bold"
                  inputMode="numeric"
                />
                <button 
                  type="button" 
                  onClick={() => setIsOtpSent(false)} 
                  className="text-xs text-blue-500 mt-2 ml-1 hover:underline"
                >
                  Raqamni o'zgartirish
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase ml-1" htmlFor="password">
                  {t.password}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center cursor-pointer group">
                <input
                  className="rounded border-gray-300 text-unigo-accent focus:ring-unigo-accent w-4 h-4"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="ml-2 text-gray-600">{t.remember}</span>
              </label>
              <button
                type="button"
                className="text-unigo-accent hover:underline font-medium"
                onClick={() => navigate('/reset-password')}
              >
                {t.forgotPassword}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-unigo-primary hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? t.loading : (isOtpSent ? "Tasdiqlash" : t.login)}
            </button>
          </form>
        </section>

        <footer className="mt-8 text-center">
          <p className="text-gray-500">
            {t.noAccount}
            <button type="button" className="text-unigo-accent font-bold hover:underline ml-1" onClick={() => navigate('/register')}>
              {t.signup}
            </button>
          </p>

          <div className="mt-6 inline-flex items-center space-x-2 bg-white/50 px-3 py-1 rounded-full border border-white/20">
            <select
              value={langKey}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-500 outline-none cursor-pointer"
            >
              {localizedLanguages.map((l) => (
                <option key={l.key} value={l.key}>{l.label}</option>
              ))}
            </select>
          </div>
        </footer>
      </main>
    </div>
  );
});

export default Auth;