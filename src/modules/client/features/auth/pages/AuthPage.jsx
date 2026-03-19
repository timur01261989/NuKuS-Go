/**
 * AuthPage.jsx — Login sahifasi (Composition Root)
 * Senior Architect standard: Toza UI, xavfsiz state handling.
 */
import React, { memo } from 'react';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import { useLoginController } from './useLoginController.js';
import AuthHero from './AuthHero.jsx';
import AuthForm from './AuthForm.jsx';

function AuthPage() {
  const { t } = useLanguage();
  const ctrl = useLoginController();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans selection:bg-orange-100">
      <main className="w-full max-w-[400px] flex flex-col space-y-6" data-purpose="login-container">
        
        {/* Brending va Hero qismi - Axlatlardan tozalandi */}
        <AuthHero t={t} />

        {/* Login formasi - Markazlashtirilgan va qat'iy */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <AuthForm
            phone={ctrl.phone}
            password={ctrl.password}
            remember={ctrl.remember}
            showPassword={ctrl.showPassword}
            loading={ctrl.loading}
            t={t}
            onPhoneChange={ctrl.handlePhoneChange}
            onPasswordChange={ctrl.handlePasswordChange}
            onTogglePassword={ctrl.handleTogglePassword}
            onRememberChange={ctrl.handleRememberChange}
            onSubmit={ctrl.handleSubmit}
            onNavigateRegister={() => ctrl.navigate('/register')}
            onNavigateReset={() => ctrl.navigate('/reset-password')}
          />
        </section>

        {/* Til tanlash - Minimalist va professional */}
        <footer className="flex justify-center" data-purpose="language-footer">
          <div className="inline-flex items-center space-x-2 bg-slate-100/50 px-4 py-2 rounded-full border border-slate-200/50 transition-all hover:bg-slate-100">
            <select
              key={ctrl.langKey}
              value={ctrl.langKey}
              onChange={(e) => ctrl.handleLanguageChange(e.target.value)}
              className="bg-transparent text-[13px] font-semibold text-slate-600 outline-none cursor-pointer appearance-none"
              aria-label={t?.language || 'Til'}
            >
              {ctrl.localizedLanguages.map((lang) => (
                <option key={lang.key} value={lang.key}>{lang.label}</option>
              ))}
            </select>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default memo(AuthPage);