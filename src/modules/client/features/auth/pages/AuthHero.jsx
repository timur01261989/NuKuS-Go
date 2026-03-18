/**
 * AuthHero.jsx — Login sahifasining hero/header qismi
 * Auth.jsx dan ajratildi (DOCX tavsiyasi: presentational components ajratish)
 */
import React, { memo } from 'react';
import Lottie from 'lottie-react';
import { lottieAssets } from '@/assets/lottie';
import { assetSizes } from '@/assets/assetPolish';
import { integratedAssets } from '@/assets/integrated';
import { securityAssets } from '@/assets/security';
import { paymentAssets } from '@/assets/payment';
import { essentialsAssets } from '@/assets/essentials';
import { profileVerificationSteps } from '../profileVerificationGuidance.js';

function AuthHero({ t, authTrustState }) {
  return (
    <header className="text-center mb-8" data-purpose="brand-header">
      <div className="relative overflow-hidden rounded-[32px] border border-white/30 bg-white/55 px-6 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur">
        <img
          src={securityAssets.auth.authOnboardingSelfRegister || integratedAssets.auth.onboardingTaxi}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-16"
        />
        <div className="relative z-10">
          <div className={`mx-auto mb-4 inline-flex items-center justify-center overflow-hidden rounded-[28px] bg-white/70 shadow-[12px_12px_32px_#ccd4dc,-12px_-12px_32px_#ffffff] ${assetSizes.authHeroShell}`}>
            <Lottie animationData={lottieAssets.auth.lock} loop autoplay className={assetSizes.authHeroAnimation} />
          </div>
          <div className="mx-auto mb-4 flex items-center justify-center gap-3">
            <img src={securityAssets.payment?.paymentWalletOutline || paymentAssets?.cards?.defaultAlt} alt="" className="h-9 w-auto opacity-90" />
            <img src={securityAssets.trust?.trustSuccessIllustration || paymentAssets?.states?.successAlt} alt="" className="h-4 w-4" />
            <img src={integratedAssets.auth.userOrb} alt="" className="h-10 w-10 rounded-full object-cover ring-4 ring-white/50" />
          </div>
          <h1 className="text-4xl font-bold text-unigo-dark tracking-tight">{t?.appName || 'UniGo'}</h1>
          <p className="text-unigo-accent font-medium tracking-wide uppercase text-sm mt-1">
            {t?.appTagline || 'Super App'}
          </p>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-4 overflow-hidden rounded-[28px] border border-white/30 bg-white/70 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-3 gap-2">
          {profileVerificationSteps.map((stepItem) => (
            <div key={stepItem.key} className="rounded-2xl bg-white/70 px-3 py-3 shadow-sm">
              <img
                src={
                  stepItem.key === 'phone'
                    ? securityAssets.auth.authIconPhone
                    : stepItem.key === 'document'
                      ? essentialsAssets.auth.authMaskLicense
                      : securityAssets.trust.trustCertificate
                }
                alt=""
                className="mb-2 h-5 w-5 object-contain"
              />
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{stepItem.title}</div>
              <div className="mt-1 text-xs text-slate-700">{stepItem.description}</div>
            </div>
          ))}
        </div>
        {authTrustState && (
          <div className="mt-3 flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/5">
              <img src={securityAssets.state.securityLockOutline} alt="" className="h-6 w-6 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-slate-900">{authTrustState.headline}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                  <img src={securityAssets.notifications.notifyBellUnread} alt="" className="h-3.5 w-3.5" />
                  {authTrustState.level}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                  Score {authTrustState.profileScore}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default memo(AuthHero);
