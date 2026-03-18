/**
 * AuthPage.jsx — Login sahifasi (composition root)
 * 
 * DOCX tavsiyasi: Auth.jsx → AuthPage.jsx, AuthHero.jsx, AuthForm.jsx, useLoginController.js
 * 
 * Bu fayl faqat koordinatsiya qiladi:
 *   - useLoginController → barcha biznes logika
 *   - AuthHero → header/brand/trust badges
 *   - AuthForm → login forma
 *   - Til tanlash widget
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100 p-4 font-sans">
      <main className="w-full max-w-sm" data-purpose="login-container">

        {/* Hero / Brand / Trust badges */}
        <AuthHero t={t} authTrustState={ctrl.authTrustState} />

        {/* Login forma */}
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

        {/* Til tanlash */}
        <footer className="mt-8 text-center" data-purpose="language-footer">
          <div className="inline-flex items-center space-x-2 bg-white/50 px-3 py-1 rounded-full border border-white/20">
            <select
              key={ctrl.langKey}
              value={ctrl.langKey}
              onChange={(e) => ctrl.handleLanguageChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-500 outline-none cursor-pointer"
              aria-label={t?.language || 'Til'}
            >
              {ctrl.localizedLanguages.map((lang) => (
                <option key={lang.key} value={lang.key}>{lang.label}</option>
              ))}
            </select>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default memo(AuthPage);
