import React, { memo } from 'react';
import PropTypes from 'prop-types';

function AuthForm({
  phone = '',
  password = '',
  remember = false,
  showPassword = false,
  loading = false,
  t = {},
  onPhoneChange = () => {},
  onPasswordChange = () => {},
  onTogglePassword = () => {},
  onRememberChange = () => {},
  onSubmit = () => {},
  onNavigateRegister = () => {},
  onNavigateReset = () => {},
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onSubmit === 'function') {
      onSubmit();
    }
  };

  return (
    <section className="rounded-3xl p-8 shadow-modern bg-white/90 backdrop-blur border border-white/20" aria-labelledby="authform-heading">
      <h2 id="authform-heading" className="text-xl font-semibold text-gray-800 mb-6 text-center">
        {t?.loginTitle || 'Kirish'}
      </h2>

      <form className="space-y-5" onSubmit={handleSubmit} autoComplete="on" noValidate>
        {/* Telefon */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase ml-1" htmlFor="auth-phone">
            {t?.phoneLabel || 'Telefon'}
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400 font-medium">+998</span>
            <input
              id="auth-phone"
              name="phone"
              type="tel"
              required
              placeholder={t?.phonePlaceholder || '90 123 45 67'}
              value={phone}
              onChange={(e) => typeof onPhoneChange === 'function' && onPhoneChange(e.target.value)}
              className="w-full pl-16 pr-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all text-gray-700"
              inputMode="numeric"
              pattern="[0-9\s\-]{9,15}"
              autoComplete="tel"
              aria-label={t?.phoneLabel || 'Telefon raqami'}
              aria-invalid={false}
            />
          </div>
        </div>

        {/* Parol */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase ml-1" htmlFor="auth-password">
            {t?.password || 'Parol'}
          </label>
          <div className="relative">
            <input
              id="auth-password"
              name="password"
              required
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => typeof onPasswordChange === 'function' && onPasswordChange(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all text-gray-700"
              autoComplete="current-password"
              aria-label={t?.password || 'Parol'}
              aria-invalid={false}
            />
            <button
              type="button"
              onClick={() => typeof onTogglePassword === 'function' && onTogglePassword()}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-unigo-accent"
              aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
              aria-pressed={!!showPassword}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2.036 12.322a1.012 1.012 0 010-.644C3.399 8.049 7.21 5 12 5c4.79 0 8.601 3.049 9.964 6.678a1.012 1.012 0 010 .644C20.601 15.951 16.79 19 12 19c-4.79 0-8.601-3.049-9.964-6.678z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Eslab qolish + Parolni unutdim */}
        <div className="flex items-center justify-between text-sm pt-1 gap-3">
          <label className="flex items-center cursor-pointer group" htmlFor="auth-remember">
            <input
              id="auth-remember"
              className="rounded border-gray-300 text-unigo-accent focus:ring-unigo-accent w-4 h-4"
              type="checkbox"
              checked={remember}
              onChange={(e) => typeof onRememberChange === 'function' && onRememberChange(e.target.checked)}
              aria-label={t?.remember || 'Eslab qolish'}
            />
            <span className="ml-2 text-gray-600 group-hover:text-gray-800">{t?.remember || 'Eslab qolish'}</span>
          </label>
          <button
            type="button"
            className="text-unigo-accent hover:underline font-medium"
            onClick={() => typeof onNavigateReset === 'function' && onNavigateReset()}
          >
            {t?.forgotPassword || 'Parolni unutdingizmi?'}
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full bg-unigo-primary hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all transform active:scale-[0.98] mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span aria-live="polite" role="status">
            {loading ? (t?.loading || 'Yuklanmoqda...') : (t?.login || 'Kirish')}
          </span>
        </button>
      </form>

      {/* Ro'yxatdan o'tish havolasi */}
      <p className="text-center text-gray-500 mt-6 text-sm">
        {t?.noAccount || "Akkaunt yo'q?"}
        <button
          type="button"
          className="text-unigo-accent font-bold hover:underline ml-1"
          onClick={() => typeof onNavigateRegister === 'function' && onNavigateRegister()}
        >
          {t?.signup || "Ro'yxatdan o'tish"}
        </button>
      </p>
    </section>
  );
}

AuthForm.propTypes = {
  phone: PropTypes.string,
  password: PropTypes.string,
  remember: PropTypes.bool,
  showPassword: PropTypes.bool,
  loading: PropTypes.bool,
  t: PropTypes.object,
  onPhoneChange: PropTypes.func,
  onPasswordChange: PropTypes.func,
  onTogglePassword: PropTypes.func,
  onRememberChange: PropTypes.func,
  onSubmit: PropTypes.func,
  onNavigateRegister: PropTypes.func,
  onNavigateReset: PropTypes.func,
};

export default memo(AuthForm);
