import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useLanguage } from '@shared/i18n/useLanguage';

export default function ResetPassword() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const navigate = useNavigate();
  const { t } = useLanguage();

  const normalizePhoneInput = (value) => {
    let digits = String(value || '').replace(/\D/g, '').slice(0, 9);
    let out = digits;
    if (digits.length > 2) out = `${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length > 5) out = `${out.slice(0, 6)} ${digits.slice(5)}`;
    if (digits.length > 7) out = `${out.slice(0, 9)} ${digits.slice(7)}`;
    return out;
  };

  const calcStrength = (pass) => {
    let score = 0;
    if (pass.length > 5) score += 30;
    if (pass.length > 8) score += 30;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 20;
    return Math.min(100, score);
  };

  const strengthLabel = (score) => {
    if (score < 50) return t.veryWeak;
    if (score < 80) return t.medium;
    return t.strongPassword;
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (step === 1) {
        if (phone.replace(/\D/g, '').length !== 9) {
          message.error(t.enterPhoneFull);
          return;
        }
        message.success(t.smsSent);
        setStep(2);
        return;
      }

      if (smsCode.replace(/\D/g, '').length !== 4) {
        message.error(t.codeMustBe4);
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        message.error(t.passwordMin6);
        return;
      }
      if (newPassword !== confirm) {
        message.error(t.passMismatch);
        return;
      }

      message.success(t.successPass);
      navigate('/login');
    }, 900);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100 p-4">
      <main className="w-full max-w-sm">
        <header className="text-center mb-8 relative">
          <button
            type="button"
            onClick={() => (step === 2 ? setStep(1) : navigate('/login'))}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/60 hover:bg-white/80 border border-white/30"
            aria-label="Back"
          >
            <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="inline-flex items-center justify-center w-20 h-20 bg-unigo-primary rounded-2xl shadow-lg mb-4 transform -rotate-2 mx-auto">
            <span className="text-white text-3xl font-black tracking-tighter">UG</span>
          </div>
          <h1 className="text-3xl font-extrabold text-unigo-dark tracking-tight">{t.appName}</h1>
          <p className="text-unigo-accent font-semibold tracking-wide uppercase text-xs mt-1">{t.resetTitle.toUpperCase()}</p>
        </header>

        <section className="rounded-3xl p-8 shadow-modern bg-white/90 backdrop-blur border border-white/20">
          {step === 1 ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">{t.resetTitle}</h2>
              <p className="text-gray-500 text-sm text-center mb-6">{t.enterPhone}</p>

              <form className="space-y-5" onSubmit={handleFinish}>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">{t.phoneLabel}</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-400 font-medium">+998</span>
                    <input value={phone} onChange={(e) => setPhone(normalizePhoneInput(e.target.value))} className="w-full pl-16 pr-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all text-gray-700" placeholder={t.phonePlaceholder} inputMode="numeric" autoComplete="tel" />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-unigo-primary hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? t.sending : t.sendCode}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">{t.resetTitle}</h2>
              <p className="text-gray-500 text-sm text-center mb-6">{t.enterSms}</p>

              <form className="space-y-5" onSubmit={handleFinish}>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">{t.smsCode}</label>
                  <input value={smsCode} onChange={(e) => setSmsCode(String(e.target.value).replace(/\D/g, '').slice(0, 4))} className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all text-gray-700 text-center text-3xl font-extrabold tracking-[0.6em]" placeholder="0000" inputMode="numeric" maxLength={4} autoComplete="one-time-code" />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">{t.newPassword}</label>
                  <input value={newPassword} onChange={(e) => { const v = e.target.value; setNewPassword(v); setPasswordStrength(calcStrength(v)); }} className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all text-gray-700" placeholder={t.newPassword} type="password" autoComplete="new-password" />
                  {passwordStrength > 0 && (
                    <div className="pt-2">
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-2 bg-unigo-accent transition-all" style={{ width: `${passwordStrength}%` }} />
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1">{strengthLabel(passwordStrength)}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">{t.confirmPassword}</label>
                  <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all text-gray-700" placeholder={t.confirmPassword} type="password" autoComplete="new-password" />
                </div>

                <button type="submit" disabled={loading} className="w-full bg-unigo-primary hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? t.saving : t.save}
                </button>

                <button type="button" onClick={() => setStep(1)} className="w-full text-center text-gray-500 text-sm font-semibold hover:underline">
                  {t.back}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
