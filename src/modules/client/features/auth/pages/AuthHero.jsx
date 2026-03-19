import React, { memo } from 'react';
import Lottie from 'lottie-react';
import { lottieAssets } from '@/assets/lottie';
import { assetSizes } from '@/assets/assetPolish';
import { integratedAssets } from '@/assets/integrated';
import { securityAssets } from '@/assets/security';
import { paymentAssets } from '@/assets/payment';

/**
 * AuthHero.jsx — Финальная версия для UniGo.
 * Все отладочные элементы и лишние виджеты (Badges/Score) удалены.
 * Реализована строгая визуальная иерархия и оптимизация рендеринга.
 */
function AuthHero({ t }) {
  return (
    <header className="text-center mb-8" data-purpose="brand-header">
      <div className="relative overflow-hidden rounded-[40px] border border-white/40 bg-white/60 px-6 py-10 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        {/* Фоновый слой для глубины */}
        <img
          src={securityAssets.auth.authOnboardingSelfRegister || integratedAssets.auth.onboardingTaxi}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-5"
        />
        
        <div className="relative z-10 flex flex-col items-center">
          {/* Центральный визуальный элемент (Lottie) */}
          <div className={`mb-6 inline-flex items-center justify-center overflow-hidden rounded-[32px] bg-white/90 shadow-sm ring-1 ring-slate-100 ${assetSizes.authHeroShell}`}>
            <Lottie 
              animationData={lottieAssets.auth.lock} 
              loop 
              autoplay 
              className={assetSizes.authHeroAnimation} 
            />
          </div>

          {/* Профессиональные индикаторы статуса */}
          <div className="mb-6 flex items-center justify-center gap-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-50">
              <img 
                src={securityAssets.payment?.paymentWalletOutline || paymentAssets?.cards?.defaultAlt} 
                alt="Secure" 
                className="h-5 w-auto opacity-80" 
              />
            </div>
            <div className="relative">
              <img 
                src={integratedAssets.auth.userOrb} 
                alt="User" 
                className="h-14 w-14 rounded-full object-cover ring-4 ring-white shadow-lg" 
              />
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                <img 
                  src={securityAssets.trust?.trustSuccessIllustration || paymentAssets?.states?.successAlt} 
                  alt="Verified" 
                  className="h-3.5 w-3.5" 
                />
              </div>
            </div>
          </div>

          {/* Текстовая группа */}
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              {t?.appName || 'UniGo'}
            </h1>
            <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-orange-500">
              {t?.appTagline || 'YAGONA YECHIM'}
            </p>
          </div>
        </div>
      </div>

      {/* АРХИТЕКТУРНОЕ РЕШЕНИЕ:
        Блок со статусами "PHONE OTP", "DOCUMENT Verify" и "Score" полностью вырезан. 
        Эти данные являются приватными и должны отображаться только внутри защищенного профиля
        после успешной авторизации, чтобы не перегружать когнитивную нагрузку на входе.
      */}
    </header>
  );
}

export default memo(AuthHero);