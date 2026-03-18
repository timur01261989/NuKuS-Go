import React from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { useClientText } from '../shared/i18n_clientLocalize';
import { safeBack } from '@/modules/shared/navigation/safeBack';
import { integratedAssets } from '@/assets/integrated';
import { securityAssets } from '@/assets/security';
import { calculationAssets } from '@/assets/calculation';
import { essentialsAssets } from '@/assets/essentials';

export default function ClientPaymentMethods() {
  const navigate = useNavigate();
  const { t, cp } = useClientText();

  const pricingHints = [
    { icon: calculationAssets.pricing.fair, label: cp('Barqaror narx'), desc: cp('Standart to‘lov va odatiy tarif holati.') },
    { icon: calculationAssets.pricing.surgeUp, label: cp('Yuklama narxi'), desc: cp('Talab oshganda yoki pik vaqtda ko‘rinadigan state.') },
    { icon: calculationAssets.pricing.down, label: cp('Promo foyda'), desc: cp('Chegirma yoki referral bo‘lsa pasaygan narx aks etadi.') },
  ];


  const essentialsMethodCards = [
    { icon: essentialsAssets.finance.financeCardPro, title: cp('Hamyon markazi'), desc: cp('Karta, top up va bo‘lib to‘lash funksiyalarini bir joyda ko‘rsatadi.') },
    { icon: essentialsAssets.finance.financeCredit, title: cp('Moliyaviy qatlam'), desc: cp('Credit, split va protected method ko‘rinishlarini boyitadi.') },
    { icon: essentialsAssets.core.commBell, title: cp('Holat bildirishnomasi'), desc: cp('To‘lov va challenge holatlari uchun tezkor vizual signal beradi.') },
  ];

  return (
    <div className="min-h-screen bg-softBlue dark:bg-backgroundDark font-display text-slate-900 dark:text-slate-100 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <button type="button" className="neumorphic-dark px-3 py-2 rounded-xl text-primaryHome" onClick={() => safeBack(navigate, '/client/home')}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold">{t.paymentMethods}</h1>
          <div className="w-10" />
        </div>

        <section className="neumorphic-dark overflow-hidden rounded-[28px] p-5">
          <div className="grid gap-4 md:grid-cols-[1.2fr_168px] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primaryHome/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primaryHome">
                <img src={securityAssets.payment.paymentWalletOutline || integratedAssets.payment.icons.cardPro} alt="" className="h-4 w-4" />
                <span>{cp('To‘lov markazi')}</span>
              </div>
              <h2 className="mt-4 text-2xl font-black text-slate-100">{cp("Karta va wallet oqimlari bir joyda")}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{t.paymentHelp}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <FeatureChip icon={securityAssets.payment.paymentActionAdd || integratedAssets.payment.icons.topUp} label={cp("Top up")} />
                <FeatureChip icon={securityAssets.scanner.scanQrCode || integratedAssets.payment.icons.withdraw} label={cp("Scan pay")} />
                <FeatureChip icon={securityAssets.state.securityLockOutline || integratedAssets.payment.icons.split} label={cp("Secure")} />
              </div>
            </div>
            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-[28px] bg-white/5 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <Lottie animationData={integratedAssets.payment.bankSelectorRich} loop autoplay className="h-full w-full" />
              <img src={securityAssets.payment.paymentArtMethods} alt="" className="pointer-events-none absolute inset-4 mx-auto my-auto h-24 w-24 object-contain opacity-70" />
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {essentialsMethodCards.map((item) => (
            <InfoTile key={item.title} icon={item.icon} title={item.title} desc={item.desc} />
          ))}
        </section>

        <section className="neumorphic-dark mt-4 rounded-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-200">
                <img src={calculationAssets.payment.details} alt="" className="h-4 w-4 rounded object-cover" />
                <span>{cp('To‘lov tafsiloti')}</span>
              </div>
              <div className="mt-3 text-xl font-black text-slate-100">{cp("Method tanlashda pricing konteksti ham ko‘rinsin")}</div>
              <div className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {cp("Payment usuli tanlanganda promo, surge va odatiy narx holatlari alohida icon va izoh bilan ko‘rinadigan qatlam qo‘shildi.")}
              </div>
            </div>
            <img src={calculationAssets.payment.card} alt="" className="h-16 w-16 rounded-2xl object-cover shadow-[0_16px_40px_rgba(0,0,0,0.18)]" />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {pricingHints.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <img src={item.icon} alt="" className="h-10 w-10 rounded-xl object-cover" />
                <div className="mt-3 text-sm font-bold text-slate-100">{item.label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="neumorphic-dark mt-4 rounded-2xl p-5 space-y-4">
          <div className="grid gap-3">
            <PaymentCard icon={integratedAssets.payment.icons.topUp} title={t.wallet} desc={t.walletBalance} />
            <PaymentCard icon={integratedAssets.payment.icons.cardPro} title={t.cardSoon.split(' (')[0]} desc={t.cardSoon.match(/\(.+\)/)?.[0] || ''} disabled />
            <PaymentCard icon={integratedAssets.payment.icons.split} title={cp('Payme / Click')} desc={t.paymeClickSoon.match(/\(.+\)/)?.[0] || t.paymeClickSoon} disabled />
          </div>

          <div className="rounded-2xl border border-primaryHome/20 bg-primaryHome/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <img src={integratedAssets.payment.icons.withdraw} alt="" className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-slate-100">{cp("Kuchaytirilgan payment UI")}</div>
                <div className="text-xs text-slate-400">{cp("Visual qatlam yangilandi, ammo payment logikasi o‘zgarmadi.")}</div>
              </div>
            </div>
          </div>

          <button type="button" className="w-full bg-primaryHome hover:bg-primaryHome/90 text-backgroundDark font-bold py-3 rounded-xl active:scale-95" onClick={() => navigate('/client/wallet')}>
            {t.wallet}
          </button>
          <div className="rounded-2xl border border-primaryHome/20 bg-primaryHome/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <img src={securityAssets.notifications.notifyBellUnread} alt="" className="h-5 w-5 object-contain" />
              </div>
              <div>
                <div className="font-bold text-slate-100">{cp("Ogohlantirishlar va limitlar")}</div>
                <div className="text-xs text-slate-400">{cp("To‘lov holati, skan va xavfsizlik bannerlari uchun iconlar tayyorlandi.")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentCard({ icon, title, desc, disabled }) {
  return (
    <div className={'flex items-center justify-between rounded-2xl p-4 border ' + (disabled ? 'border-slate-700/60 opacity-70' : 'border-primaryHome/30')}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primaryHome/10 p-3">
          <img src={icon} alt="" className="h-6 w-6 object-contain" />
        </div>
        <div>
          <div className="font-bold">{title}</div>
          <div className="text-xs text-slate-400">{desc}</div>
        </div>
      </div>
      <span className="material-symbols-outlined text-slate-400">chevron_right</span>
    </div>
  );
}

function FeatureChip({ icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200">
      <img src={icon} alt="" className="h-4 w-4 object-contain" />
      <span>{label}</span>
    </div>
  );
}
