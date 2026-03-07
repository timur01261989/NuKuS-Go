import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@shared/i18n/useLanguage';
import { safeBack } from '@/shared/navigation/safeBack';

export default function ClientPaymentMethods() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-softBlue dark:bg-backgroundDark font-display text-slate-900 dark:text-slate-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <button type="button" className="neumorphic-dark px-3 py-2 rounded-xl text-primaryHome" onClick={() => safeBack(navigate, '/client/home')}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">{t.paymentMethods}</h1>
        <div className="w-10" />
      </div>

      <div className="neumorphic-dark rounded-2xl p-5 space-y-4">
        <p className="text-sm text-slate-300">{t.paymentHelp}</p>
        <div className="grid gap-3">
          <PaymentCard icon="account_balance_wallet" title={t.wallet} desc={t.walletBalance} />
          <PaymentCard icon="credit_card" title={t.cardSoon.split(" (")[0]} desc={t.cardSoon.match(/\(.+\)/)?.[0] || ""} disabled />
          <PaymentCard icon="payments" title="Payme / Click" desc={t.paymeClickSoon.match(/\(.+\)/)?.[0] || t.paymeClickSoon} disabled />
        </div>
        <button type="button" className="w-full bg-primaryHome hover:bg-primaryHome/90 text-backgroundDark font-bold py-3 rounded-xl active:scale-95" onClick={() => navigate('/client/wallet')}>
          {t.wallet}
        </button>
      </div>
    </div>
  );
}

function PaymentCard({ icon, title, desc, disabled }) {
  return (
    <div className={'flex items-center justify-between rounded-2xl p-4 border ' + (disabled ? 'border-slate-700/60 opacity-70' : 'border-primaryHome/30')}>
      <div className="flex items-center gap-3">
        <div className="bg-primaryHome/10 p-3 rounded-xl text-primaryHome"><span className="material-symbols-outlined">{icon}</span></div>
        <div><div className="font-bold">{title}</div><div className="text-xs text-slate-400">{desc}</div></div>
      </div>
      <span className="material-symbols-outlined text-slate-400">chevron_right</span>
    </div>
  );
}
