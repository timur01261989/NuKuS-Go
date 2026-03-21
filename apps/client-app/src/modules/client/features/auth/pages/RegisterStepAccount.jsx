/**
 * RegisterStepAccount.jsx — Ro'yxatdan o'tish 1-qadam: Ma'lumotlarni kiritish
 * Register.jsx dan ajratildi (DOCX: RegisterStepAccount.jsx)
 */
import React, { memo } from 'react';
import { normalizeReferralCode } from '@/services/referralLinkService.js';

function RegisterStepAccount({
  name, surname, phone, password, referralCode, referralStatus,
  loading, tr,
  onNameChange, onSurnameChange, onPhoneChange, onPasswordChange,
  onReferralChange, onReferralBlur, onReferralCheck,
  onSubmit, onBack,
}) {
  const referralHelperColor = referralStatus.error ? 'text-red-500' : referralStatus.valid ? 'text-green-600' : 'text-slate-500';
  const referralHelperText  = referralStatus.checking
    ? tr('loading', 'Tekshirilmoqda...')
    : referralStatus.error || (referralStatus.valid && referralStatus.inviter?.full_name
        ? `${tr('referral.inviterLabel','Taklif qiluvchi')}: ${referralStatus.inviter.full_name}`
        : tr('referral.optionalAtRegister', 'Taklif kodi ixtiyoriy'));

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {/* Ism */}
      <div>
        <label className="text-xs font-semibold text-slate-500 ml-1">{tr('name','Ism')}</label>
        <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3">
          <input value={name} onChange={(e)=>onNameChange(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
            placeholder={tr('register.namePlaceholder','Ismingiz')} autoComplete="given-name"/>
        </div>
      </div>

      {/* Familiya */}
      <div>
        <label className="text-xs font-semibold text-slate-500 ml-1">{tr('surname','Familiya')}</label>
        <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3">
          <input value={surname} onChange={(e)=>onSurnameChange(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
            placeholder={tr('register.surnamePlaceholder','Familiyangiz')} autoComplete="family-name"/>
        </div>
      </div>

      {/* Telefon */}
      <div>
        <label className="text-xs font-semibold text-slate-500 ml-1">{tr('phoneLabel','Telefon')}</label>
        <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3 flex items-center">
          <span className="text-slate-600 font-semibold mr-2">+998</span>
          <input value={phone} onChange={(e)=>onPhoneChange(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
            placeholder={tr('phonePlaceholder','90 123 45 67')} inputMode="numeric" autoComplete="tel"/>
        </div>
      </div>

      {/* Parol */}
      <div>
        <label className="text-xs font-semibold text-slate-500 ml-1">{tr('password','Parol')}</label>
        <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3">
          <input type="password" value={password} onChange={(e)=>onPasswordChange(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
            placeholder={tr('register.passwordPlaceholder','Parol yarating')} autoComplete="new-password"/>
        </div>
      </div>

      {/* Referral */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-semibold text-slate-500 ml-1">{tr('referralCode','Taklif kodi')}</label>
          <button type="button" onClick={onReferralCheck}
            disabled={referralStatus.checking || !referralCode}
            className="text-xs font-semibold text-[#ec5b13] disabled:opacity-50">
            {tr('checkPromo','Tekshirish')}
          </button>
        </div>
        <div className="mt-2 rounded-2xl bg-[#E3EDF7] shadow-[inset_8px_8px_16px_#ccd4dc,inset_-8px_-8px_16px_#ffffff] px-4 py-3">
          <input value={referralCode}
            onChange={(e)=>onReferralChange(normalizeReferralCode(e.target.value))}
            onBlur={onReferralBlur}
            className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400 uppercase"
            placeholder={tr('referral.optionalAtRegisterPlaceholder','Taklif kodi (ixtiyoriy)')}
            autoComplete="off"/>
        </div>
        <p className={`mt-2 text-xs ${referralHelperColor}`}>{referralHelperText}</p>
      </div>

      {/* SMS olish */}
      <button type="submit" disabled={loading}
        className="w-full rounded-2xl bg-[#ec5b13] text-white font-bold py-4 shadow-lg shadow-[#ec5b13]/20 hover:bg-[#d44d0a] active:scale-[0.99] transition-all disabled:opacity-60">
        {loading ? tr('loading','Yuklanmoqda...') : tr('register.getCode','SMS kod olish')}
      </button>

      <button type="button" onClick={onBack}
        className="w-full rounded-2xl bg-white text-slate-700 font-semibold py-4 border border-slate-200 hover:bg-slate-50 transition-all">
        {tr('back','Orqaga')}
      </button>
    </form>
  );
}

export default memo(RegisterStepAccount);
