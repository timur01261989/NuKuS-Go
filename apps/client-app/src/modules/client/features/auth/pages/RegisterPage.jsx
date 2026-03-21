/**
 * RegisterPage.jsx — Ro'yxatdan o'tish sahifasi (composition root)
 *
 * DOCX: Register.jsx → RegisterPage.jsx, useRegisterController.js,
 *       RegisterStepAccount.jsx, RegisterStepOtp.jsx
 */
import React, { memo } from 'react';
import Lottie from 'lottie-react';
import { lottieAssets } from '@/assets/lottie';
import { assetSizes } from '@/assets/assetPolish';
import { securityAssets } from '@/assets/security';
import { useRegisterController } from './useRegisterController.js';
import RegisterStepAccount from './RegisterStepAccount.jsx';
import RegisterStepOtp from './RegisterStepOtp.jsx';

function RegisterPage() {
  const ctrl = useRegisterController();

  const headerIcon = (
    <div className="relative overflow-hidden rounded-[32px] border border-white/30 bg-white/60 px-5 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.10)] backdrop-blur">
      <img
        src={ctrl.step === 2 ? securityAssets.auth.authArtBiometryStart : securityAssets.auth.authOnboardingSelfRegister}
        alt="" className="absolute inset-0 h-full w-full object-cover opacity-15"
      />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className={`flex items-center justify-center overflow-hidden rounded-[28px] bg-white/70 shadow-[12px_12px_32px_#ccd4dc,-12px_-12px_32px_#ffffff] ${assetSizes.authHeroShell}`}>
          <Lottie
            animationData={ctrl.step === 2 ? lottieAssets.auth.otpChallenge : lottieAssets.status.awaitLight}
            loop autoplay className={assetSizes.authHeroAnimation}
          />
        </div>
      </div>
    </div>
  );

  // Qadam 2 — OTP
  if (ctrl.step === 2) {
    return (
      <div className="min-h-screen bg-[#E3EDF7] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[32px] p-8 bg-white/80 shadow-[20px_20px_60px_#c5d0da,-20px_-20px_60px_#ffffff] border border-white/60">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-5">{headerIcon}</div>
            <h1 className="text-4xl font-bold text-slate-900">UniGo</h1>
            <p className="mt-2 text-sm text-slate-500">{ctrl.tr('register.smsSentInfo','SMS kodni kiriting')}</p>
            <p className="mt-1 text-xs text-slate-500">{ctrl.step === 2 && ctrl.phone ? `+998${ctrl.phone}` : ''}</p>
          </div>
          <RegisterStepOtp
            otp={ctrl.otp}
            otpMeta={ctrl.otpMeta}
            loading={ctrl.loading}
            fullPhone={ctrl.phone}
            tr={ctrl.tr}
            onOtpChange={ctrl.setOtp}
            onVerify={ctrl.handleVerifyOtp}
            onResend={ctrl.handleResendOtp}
            onBack={() => ctrl.navigate(-1)}
          />
        </div>
      </div>
    );
  }

  // Qadam 1 — Ma'lumotlar
  return (
    <div className="min-h-screen bg-[#E3EDF7] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="mb-6">{headerIcon}</div>
          <h1 className="text-5xl font-bold text-[#1e293b] tracking-tight">UniGo</h1>
          <p className="text-[#ec5b13] font-medium mt-1 text-base">{ctrl.tr('register.createAccountTitle','Yangi hisob yaratish')}</p>
        </div>

        <div className="rounded-[32px] p-8 bg-white/80 shadow-[20px_20px_60px_#c5d0da,-20px_-20px_60px_#ffffff] border border-white/60">
          <div className="flex items-center justify-between mb-8">
            <button type="button" onClick={() => ctrl.navigate('/login')}
              className="w-12 h-12 rounded-2xl bg-[#E3EDF7] shadow-[8px_8px_16px_#ccd4dc,-8px_-8px_16px_#ffffff] flex items-center justify-center active:scale-95 transition-transform"
              aria-label={ctrl.tr('back','Orqaga')}>
              <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h2 className="text-xl font-bold text-slate-800">{ctrl.tr('register','Ro\'yxatdan o\'tish')}</h2>
            <div className="w-12 h-12"/>
          </div>

          <RegisterStepAccount
            name={ctrl.name}
            surname={ctrl.surname}
            phone={ctrl.phone}
            password={ctrl.password}
            referralCode={ctrl.referralCode}
            referralStatus={ctrl.referralStatus}
            loading={ctrl.loading}
            tr={ctrl.tr}
            onNameChange={ctrl.setName}
            onSurnameChange={ctrl.setSurname}
            onPhoneChange={ctrl.setPhone}
            onPasswordChange={ctrl.setPassword}
            onReferralChange={ctrl.setReferralCode}
            onReferralBlur={ctrl.handleReferralBlur}
            onReferralCheck={ctrl.handleReferralBlur}
            onSubmit={ctrl.handleGetOtp}
            onBack={() => ctrl.navigate('/login')}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(RegisterPage);
