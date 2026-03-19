import React, { memo } from 'react';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import { useLoginController } from './useLoginController.js';
import AuthForm from './AuthForm.jsx';

/**
 * AuthPage.jsx — Login sahifasi Composition Root
 * Senior Architect standard: Toza UI, xavfsiz state handling
 */
function AuthPage() {
  const { t } = useLanguage();
  const ctrl = useLoginController();

  // Ctrl null yoki undefined bo'lsa ham xatoga tushmaslik uchun fallbacklar
  const phone = ctrl?.phone ?? '';
  const password = ctrl?.password ?? '';
  const remember = ctrl?.remember ?? false;
  const showPassword = ctrl?.showPassword ?? false;
  const loading = ctrl?.loading ?? false;
  const langKey = ctrl?.langKey ?? '';
  const localizedLanguages = Array.isArray(ctrl?.localizedLanguages) ? ctrl.localizedLanguages : [];

  const handleLanguageChange = (value) => {
    if (typeof ctrl?.handleLanguageChange === 'function') {
      ctrl.handleLanguageChange(value);
    }
  };

  const navigate = (path) => {
    if (typeof ctrl?.navigate === 'function') {
      ctrl.navigate(path);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans selection:bg-orange-100">
      <main className="w-full max-w-[400px] flex flex-col space-y-6" data-purpose="login-container" role="main">
        {/* Login formasi */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100" aria-labelledby="login-heading">
          <h2 id="login-heading" className="sr-only">Login</h2>
          <AuthForm
            phone={phone}
            password={password}
            remember={remember}
            showPassword={showPassword}
            loading={loading}
            t={t}
            onPhoneChange={typeof ctrl?.handlePhoneChange === 'function' ? ctrl.handlePhoneChange : () => {}}
            onPasswordChange={typeof ctrl?.handlePasswordChange === 'function' ? ctrl.handlePasswordChange : () => {}}
            onTogglePassword={typeof ctrl?.handleTogglePassword === 'function' ? ctrl.handleTogglePassword : () => {}}
            onRememberChange={typeof ctrl?.handleRememberChange === 'function' ? ctrl.handleRememberChange : () => {}}
            onSubmit={typeof ctrl?.handleSubmit === 'function' ? ctrl.handleSubmit : () => {}}
            onNavigateRegister={() => navigate('/register')}
            onNavigateReset={() => navigate('/reset-password')}
          />
        </section>

        {/* Til tanlash */}
        <footer className="flex justify-center" data-purpose="language-footer" aria-label={t?.language || 'Til tanlash'}>
          <div className="inline-flex items-center space-x-2 bg-slate-100/50 px-4 py-2 rounded-full border border-slate-200/50 transition-all hover:bg-slate-100">
            <select
              value={langKey}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-transparent text-[13px] font-semibold text-slate-600 outline-none cursor-pointer appearance-none"
              aria-label={t?.language || 'Til'}
            >
              {localizedLanguages.length > 0 ? (
                localizedLanguages.map((lang) => (
                  <option key={lang.key} value={lang.key}>{lang.label}</option>
                ))
              ) : (
                <option value="en">English</option>
              )}
            </select>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default memo(AuthPage);
