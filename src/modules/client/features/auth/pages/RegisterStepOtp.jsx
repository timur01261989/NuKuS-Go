/**
 * RegisterStepOtp.jsx — Ro'yxatdan o'tish 2-qadam: OTP tasdiqlash
 * Register.jsx dan ajratildi (DOCX: RegisterStepOtp.jsx)
 */
import React, { memo } from 'react';

function RegisterStepOtp({ otp, otpMeta, loading, fullPhone, tr, onOtpChange, onVerify, onResend, onBack }) {
  return (
    <div className="space-y-5">
      {/* OTP input */}
      <div>
        <label className="text-xs font-semibold text-slate-500 ml-1">{tr('register.smsCode','Tasdiqlash kodi')}</label>
        <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3">
          <input
            value={otp}
            onChange={(e) => onOtpChange(String(e.target.value||'').replace(/\D/g,'').slice(0,6))}
            className="w-full bg-transparent outline-none text-center tracking-[0.5em] text-xl font-black text-slate-800 placeholder:text-slate-400"
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={tr('register.smsCode','Tasdiqlash kodi')}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {fullPhone && <span>{fullPhone} • </span>}
          {tr('register.codeExpiresIn','Muddat')}: {otpMeta.expiresInSeconds}s
        </p>
      </div>

      {/* Tasdiqlash */}
      <button type="button" onClick={() => onVerify(otp)} disabled={loading}
        className="w-full rounded-2xl bg-[#ec5b13] text-white font-bold py-4 shadow-lg shadow-[#ec5b13]/20 hover:bg-[#d44d0a] active:scale-[0.99] transition-all disabled:opacity-60">
        {loading ? tr('loading','Yuklanmoqda...') : tr('register.confirm','Tasdiqlash')}
      </button>

      {/* Qayta yuborish */}
      <button type="button" onClick={onResend} disabled={loading || otpMeta.cooldownLeft > 0}
        className="w-full rounded-2xl bg-white text-slate-700 font-semibold py-4 border border-slate-200 hover:bg-slate-50 active:scale-[0.99] transition-all disabled:opacity-50">
        {otpMeta.cooldownLeft > 0
          ? `${tr('register.waitBeforeResend','Kuting')} ${otpMeta.cooldownLeft}s`
          : tr('register.resendCode','Kodni qayta yuborish')}
      </button>

      {/* Orqaga */}
      <button type="button" onClick={onBack}
        className="w-full rounded-2xl bg-white text-slate-700 font-semibold py-4 border border-slate-200 hover:bg-slate-50 transition-all">
        {tr('back','Orqaga')}
      </button>
    </div>
  );
}

export default memo(RegisterStepOtp);
