import React, { useEffect, useState, useCallback, useMemo } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import { message } from 'antd'; 
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js'; 
import { getLocalizedLanguages } from '@/modules/shared/i18n/languages.js'; 
import { supabase } from '@/services/supabase/supabaseClient';
import { useAppMode } from '@/app/providers/AppModeProvider'; 
import { otpService } from '@/services/otpService';

/**

UniGo Super App - Authentication Module

Strict Performance Standards: React.memo, useCallback, and useMemo. */ const Auth = React.memo(function Auth() { const navigate = useNavigate(); const [loading, setLoading] = useState(false); const [phone, setPhone] = useState(''); const [password, setPassword] = useState(''); const [otpCode, setOtpCode] = useState(''); const [isOtpSent, setIsOtpSent] = useState(false); const [remember, setRemember] = useState(false); const [showPassword, setShowPassword] = useState(false);


const { langKey, setLanguage, t } = useLanguage(); const localizedLanguages = useMemo(() => getLocalizedLanguages(langKey), [langKey]); const { appMode } = useAppMode();

const formatUzPhone = useCallback((rawPhone) => { let digits = String(rawPhone || '').replace(/\D/g, '');

if (digits.length === 9) {
  digits = 998${digits};
}

if (!digits.startsWith('998')) {
  digits = 998${digits};
}

digits = digits.slice(0, 12);
return +${digits};

}, []);

const normalizePhoneInput = useCallback((value) => { const digits = String(value || '').replace(/\D/g, '').slice(0, 9);

if (digits.length <= 2) {
  return digits;
}

if (digits.length <= 5) {
  return ${digits.slice(0, 2)} ${digits.slice(2)};
}

if (digits.length <= 7) {
  return ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)};
}

return ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)};

}, []);

useEffect(() => { let isMounted = true;

const checkSession = async () => {
  if (!supabase?.auth) {
    return;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Session read failed:', error);
    return;
  }

  if (isMounted && data?.session) {
    navigate('/', { replace: true });
  }
};

void checkSession();

return () => {
  isMounted = false;
};

}, [navigate]);

useEffect(() => { try { const last = localStorage.getItem('last_phone'); if (last) { setPhone((prev) => (prev ? prev : normalizePhoneInput(last))); setRemember(true); } } catch (error) { console.error('Failed to read from localStorage:', error); } }, [normalizePhoneInput]);

const handlePhoneChange = useCallback( (e) => { setPhone(normalizePhoneInput(e.target.value)); }, [normalizePhoneInput], );

const handlePasswordChange = useCallback((e) => { setPassword(e.target.value); }, []);

const handleOtpCodeChange = useCallback((e) => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); }, []);

const togglePasswordVisibility = useCallback(() => { setShowPassword((prev) => !prev); }, []);

const handleRememberChange = useCallback((e) => { setRemember(e.target.checked); }, []);

const handleLanguageChange = useCallback( (e) => { const nextLang = e.target.value; setLanguage(nextLang);

setTimeout(() => {
    const selectedLangLabel = getLocalizedLanguages(nextLang).find((item) => item.key === nextLang)?.label;
    message.success(selectedLangLabel || t.languageChanged);
  }, 0);
},
[setLanguage, t],

);

const navigateToReset = useCallback(() => { navigate('/reset-password'); }, [navigate]);

const navigateToRegister = useCallback(() => { navigate('/register'); }, [navigate]);

/**

New functionality: Send OTP via Edge Function */ const handleSendOtp = useCallback(async () => { const digits = phone.replace(/\D/g, ''); if (digits.length !== 9) { message.error(t.phoneRequired); return; }


setLoading(true);
try {
  const fullPhone = formatUzPhone(digits);
  const result = await otpService.sendOtp(fullPhone);
[15.03.2026 2:01] Тима Брат: if (result.success) {
    setIsOtpSent(true);
    message.success(t.otpSent || 'SMS kod yuborildi');
  } else {
    throw new Error(result.error || 'SMS yuborishda xatolik');
  }
} catch (err) {
  message.error(err?.message || t.invalidLogin);
} finally {
  setLoading(false);
}

}, [phone, formatUzPhone, t]);

const onSubmit = useCallback( async (e) => { e.preventDefault();

if (loading) {
    return;
  }

  const digits = phone.replace(/\D/g, '');

  if (digits.length !== 9) {
    message.error(t.phoneRequired);
    return;
  }

  if (!isOtpSent && !password) {
    message.error(t.passwordRequired);
    return;
  }

  if (isOtpSent && otpCode.length !== 6) {
    message.error(t.otpRequired || 'Tasdiqlash kodi kerak');
    return;
  }

  setLoading(true);

  try {
    const fullPhone = formatUzPhone(digits);
    let authResult;

    if (isOtpSent && otpCode) {
      authResult = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otpCode,
        type: 'sms',
      });
    } else {
      authResult = await supabase.auth.signInWithPassword({
        phone: fullPhone,
        password,
      });
    }

    const { error } = authResult;

    if (error) {
      throw error;
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData?.user;

      if (user?.id) {
        const nowIso = new Date().toISOString();
        const profilePayload = {
          id: user.id,
          phone: user.phone || fullPhone,
          phone_e164: user.phone || fullPhone,
          phone_verified_at: nowIso,
          last_login: nowIso,
        };

        const { error: profileError } = await supabase.from('profiles').upsert([profilePayload]);

        if (profileError) {
          throw profileError;
        }
      }
    } catch (profileError) {
      console.error('Profile update failed:', profileError);
    }

    try {
      if (remember) {
        localStorage.setItem('last_phone', digits);
      } else {
        localStorage.removeItem('last_phone');
      }
    } catch (storageError) {
      console.error('LocalStorage access failed:', storageError);
    }

    message.success(t.welcome);
    navigate('/', { replace: true, state: { appMode } });
  } catch (authError) {
    console.error('Auth failed:', authError);
    message.error(t.invalidLogin);
  } finally {
    setLoading(false);
  }
},
[appMode, formatUzPhone, isOtpSent, loading, navigate, otpCode, password, phone, remember, t],

);

return ( <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100 p-4 font-sans"> <main className="w-full max-w-sm" data-purpose="login-container"> <header className="text-center mb-8" data-purpose="brand-header"> <div className="inline-flex items-center justify-center w-20 h-20 bg-unigo-primary rounded-2xl shadow-lg mb-4 transform rotate-3"> <span className="text-white text-3xl font-black tracking-tighter">UG</span> </div> <h1 className="text-4xl font-bold text-unigo-dark tracking-tight">{t.appName}</h1> <p className="text-unigo-accent font-medium tracking-wide uppercase text-sm mt-1">{t.appTagline}</p> </header>

<section className="rounded-3xl p-8 shadow-modern bg-white/90 backdrop-blur border border-white/20">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">{t.loginTitle}</h2>

      <form className="space-y-5" onSubmit={onSubmit} autoComplete="on">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase ml-1" htmlFor="phone">
            {t.phoneLabel}
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400 font-medium">+998</span>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder={t.phonePlaceholder}
              value={phone}
              onChange={handlePhoneChange}
              className="w-full pl-16 pr-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all text-gray-700"
              inputMode="numeric"
              autoComplete="tel-national"
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
            {loading ? t.loading : 'SMS kod yuborish'}
          </button>
        )}

        {isOtpSent ? (
          <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">
              {t.otpLabel || 'Tasdiqlash kodi'}
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="000000"
              value={otpCode}
              onChange={handleOtpCodeChange}
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
                name="password"
                required
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all text-gray-700"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-unigo-accent"
                aria-label="Toggle password visibility"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path
                    d="M2.036 12.322a1.012 1.012 0 010-.644C3.399 8.049 7.21 5 12 5c4.79 0 8.601 3.049 9.964 6.678a1.012 1.012 0 010 .644C20.601 15.951 16.79 19 12 19c-4.79 0-8.601-3.049-9.964-6.678z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm pt-1 gap-3">
          <label className="flex items-center cursor-pointer group">
            <input
              className="rounded border-gray-300 text-unigo-accent focus:ring-unigo-accent w-4 h-4"
              type="checkbox"
              checked={remember}
              onChange={handleRememberChange}
            />
            <span className="ml-2 text-gray-600 group-hover:text-gray-800">{t.remember}</span>
          </label>
         <button
            type="button"
            className="text-unigo-accent hover:underline font-medium"
            onClick={navigateToReset}
          >
            {t.forgotPassword}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-unigo-primary hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all transform active:scale-[0.98] mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? t.loading : isOtpSent ? 'Tasdiqlash' : t.login}
        </button>
      </form>
    </section>

    <footer className="mt-8 text-center" data-purpose="footer-links">
      <p className="text-gray-500">
        {t.noAccount}
        <button
          type="button"
          className="text-unigo-accent font-bold hover:underline ml-1"
          onClick={navigateToRegister}
        >
          {t.signup}
        </button>
      </p>

      <div className="mt-6 inline-flex items-center space-x-2 bg-white/50 px-3 py-1 rounded-full border border-white/20">
        <select
          key={langKey}
          value={langKey}
          onChange={handleLanguageChange}
          className="bg-transparent text-xs font-bold text-gray-500 outline-none cursor-pointer"
          aria-label={t.language}
        >
          {localizedLanguages.map((language) => (
            <option key={language.key} value={language.key}>
              {language.label}
            </option>
          ))}
        </select>
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </footer>
  </main>
</div>

); });

export default Auth;