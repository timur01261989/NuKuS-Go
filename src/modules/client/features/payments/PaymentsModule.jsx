import React from 'react';
import { Card, CardHeader, CardContent, Button } from '../../shared/ui/index.js';
import { useLanguage } from '@/modules/shared/i18n/useLanguage';
import { securityAssets } from '@/assets/security';
import { calculationAssets } from '@/assets/calculation';
import { essentialsAssets } from '@/assets/essentials';

const quickActions = [
  { icon: 'paymentWalletFill', label: 'Hamyon' },
  { icon: 'scanQrCode', label: 'Scan pay' },
  { icon: 'trustCertificate', label: 'Himoyalangan' },
];

const statusCards = [
  { icon: 'paymentMethodUzcard', title: 'Uzcard ready', desc: 'Lokal to‘lov oqimiga tayyor qatlam' },
  { icon: 'paymentMethodHumo', title: 'Humo ready', desc: 'Karta ko‘rinishi va xavfsiz markerlar' },
  { icon: 'securityWarningOutline', title: 'Risk checks', desc: 'Ogohlantirish va verifikatsiya holatlari' },
];

const essentialsFinanceCards = [
  { icon: essentialsAssets.finance.financeTopUp, title: 'Top up ready', desc: 'Balans to‘ldirish va pul oqimi uchun yangi visual qatlam.' },
  { icon: essentialsAssets.finance.financeWithdraw, title: 'Withdraw ready', desc: 'Yechib olish va limit cardlari uchun tayyor blok.' },
  { icon: essentialsAssets.finance.financeSplit, title: 'Split ready', desc: 'Bo‘lib to‘lash va finance actions bir xil uslubda ko‘rinadi.' },
];

const pricingCards = [
  { icon: calculationAssets.pricing.fair, title: 'Barqaror narx', desc: 'Bazaviy tarif va odatiy to‘lov oqimi.' },
  { icon: calculationAssets.pricing.surgeUp, title: 'Yuklama narxi', desc: 'Band vaqtda pricing state alohida ko‘rinadi.' },
  { icon: calculationAssets.pricing.down, title: 'Promo foyda', desc: 'Chegirma yoki referral bilan pasaygan narx ko‘rsatiladi.' },
];

export function PaymentsModule() {
  const { tr } = useLanguage();
  return (
    <div className="p-3">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold">{tr("payments.title", "Payments")}</div>
              <div className="text-sm text-gray-600">{tr("payments.subtitle", "Balans, to‘lovlar, tarix")}</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700">
              <img src={securityAssets.trust.trustCertificate} alt="" className="h-4 w-4 object-contain" />
              <span>{tr("payments.security", "Protected flow")}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[1.3fr_0.9fr]">
            <div>
              <div className="text-sm text-gray-700">{tr("payments.scaffold", "Bu modul tayyor scaffold. Keyin Click/Payme/Uzcard ulaysiz.")}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {quickActions.map((item) => (
                  <div key={item.label} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                    <img
                      src={securityAssets.payment[item.icon] || securityAssets.scanner[item.icon] || securityAssets.trust[item.icon]}
                      alt=""
                      className="h-4 w-4 object-contain"
                    />
                    <span>{tr(`payments.${item.label}`, item.label)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Button>{tr("payments.topup", "Balansni to‘ldirish")}</Button>
                <Button variant="secondary">{tr("common.history", "Tarix")}</Button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {essentialsFinanceCards.map((card) => (
                  <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <img src={card.icon} alt="" className="h-10 w-10 rounded-xl object-contain" />
                    <div className="mt-3 text-sm font-bold text-slate-900">{tr(`payments.${card.title}`, card.title)}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-600">{tr(`payments.${card.desc}`, card.desc)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {pricingCards.map((card) => (
                  <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <img src={card.icon} alt="" className="h-10 w-10 rounded-xl object-cover" />
                    <div className="mt-3 text-sm font-bold text-slate-900">{tr(`payments.${card.title}`, card.title)}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-600">{tr(`payments.${card.desc}`, card.desc)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              {statusCards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50">
                      <img
                        src={securityAssets.payment[card.icon] || securityAssets.state[card.icon]}
                        alt=""
                        className="h-6 w-6 object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{tr(`payments.${card.title}`, card.title)}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-600">{tr(`payments.${card.desc}`, card.desc)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
