import React, { memo, useMemo } from 'react';
import Lottie from 'lottie-react';
import { lottieAssets } from '@/assets/lottie';
import { assetSizes } from '@/assets/assetPolish';
import { integratedAssets } from '@/assets/integrated';
import { securityAssets } from '@/assets/security';
import { paymentAssets } from '@/assets/payment';
import { essentialsAssets } from '@/assets/essentials';

/**
 * AuthHero.jsx — UniGo Super App brending va xavfsizlik indikatorlari.
 * Senior Architect talabi: To'liq optimallashgan va xatolarga chidamli.
 */
function AuthHero({ t, authTrustState }) {
  // Verifikatsiya qadamlarini xavfsiz render qilish uchun memoizatsiya
  const verificationSteps = useMemo(() => [
    {
      key: 'phone',
      title: t?.phoneOtp || 'PHONE',
      description: 'OTP',
      icon: securityAssets.auth?.authIconPhone || ''
    },
    {
      key: 'document',
      title: t?.documentVerify || 'DOCUMENT',
      description: 'Verify',
      icon: essentialsAssets.auth?.authMaskLicense || ''
    },
    {
      key: 'trust',
      title: t?.trustSecure || 'TRUST',
      description: 'Secure',
      icon: securityAssets.trust?.trustCertificate || ''
    }
  ], [t, authTrustState]);

  return (
    <header className="text-center mb-8" data-purpose="brand-header">
      <div className="relative overflow-hidden rounded-[40px] border border-white/40 bg-white/60 px-6 py-10 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        {/* Orqa fon qatlami */}
        <img
          src={securityAssets.auth?.authOnboardingSelfRegister || integratedAssets.auth?.onboardingTaxi || ''}
          alt="Onboarding background"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-5"
        />
        
        <div className="relative z-10 flex flex-col items-center">
          {/* Lottie animatsiyasi */}
          <div className={`mb-6 inline-flex items-center justify-center overflow-hidden rounded-[32px] bg-white/90 shadow-sm ring-1 ring-slate-100 ${assetSizes.authHeroShell}`}>
            <Lottie 
              animationData={lottieAssets.auth?.lock} 
              className={assetSizes.authHeroAnimation} 
            />
          </div>

          {/* Brend indikatorlari */}
          <div className="mb-6 flex items-center justify-center gap-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-50">
              <img 
                src={securityAssets.payment?.paymentWalletOutline || paymentAssets?.cards?.defaultAlt || ''}
                alt="Secure wallet"
                className="h-5 w-auto opacity-80" 
              />
            </div>
            <div className="relative">
              <img 
                src={integratedAssets.auth?.userOrb || ''}
                alt="User avatar"
                className="h-14 w-14 rounded-full object-cover ring-4 ring-white shadow-lg" 
              />
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                <img 
                  src={securityAssets.trust?.trustSuccessIllustration || paymentAssets?.states?.successAlt || ''}
                  alt="Verified badge"
                  className="h-3.5 w-3.5" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              {t?.appName || 'UniGo'}
            </h1>
            <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-orange-500" role="note">
              {t?.appTagline || 'YAGONA YECHIM'}
            </p>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-4 overflow-hidden rounded-[28px] border border-white/30 bg-white/70 p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          {verificationSteps.map((step) => (
            <div key={step.key} className="rounded-2xl bg-white/70 px-3 py-3 shadow-sm border border-white/50">
              {step.icon && (
                <img
                  src={step.icon}
                  alt={`${step.title} icon`}
                  className="mx-auto mb-2 h-5 w-5 object-contain opacity-70"
                />
              )}
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-800">{step.title}</div>
              <div className="text-[9px] font-medium text-slate-400">{step.description}</div>
            </div>
          ))}
        </div>

        {authTrustState && (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest">
                {authTrustState.level || 'Growing'}
              </span>
            </div>
            <div className="text-[11px] font-black text-orange-500 uppercase">
              Score {authTrustState.profileScore ?? 0}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default memo(AuthHero);
