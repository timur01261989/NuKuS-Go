import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import { supabase } from "@/services/supabase/supabaseClient";
import { demoTopup, getWalletBalance } from "@/services/walletApi";
import { useClientText, formatClientMoney } from "../shared/i18n_clientLocalize";
import { paymentAssets } from "@/assets/payment";
import { supportAssets } from "@/assets/support";
import { assetSizes, assetStyles, getWalletCardBrandOrder } from "@/assets/assetPolish";
import { integratedAssets } from "@/assets/integrated";
import { securityAssets } from "@/assets/security";
import { calculationAssets } from "@/assets/calculation";
import { essentialsAssets } from "@/assets/essentials";

export default function ClientWallet() {
  const navigate = useNavigate();
  const { cp, language } = useClientText();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [err, setErr] = useState("");


  const essentialsFinanceCards = [
    { icon: essentialsAssets.finance.financeTopUp, title: cp("Tez to‘ldirish"), text: cp("Top up, split va withdraw oqimlari bir qatlamda jamlandi.") },
    { icon: essentialsAssets.finance.financeWithdraw, title: cp("Chiqim nazorati"), text: cp("Hisob-kitob va yechish amallari uchun aniq visual yo‘l-yo‘riq.") },
    { icon: essentialsAssets.loyalty.debtWarning, title: cp("Qarzdorlik holati"), text: cp("Pending yoki limit holatlarida ogohlantirish kartalari ko‘rinadi.") },
  ];

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      const j = await getWalletBalance(user.id);
      setBalance(typeof j?.balance_uzs === "number" ? j.balance_uzs : 0);
    } catch (e) {
      setErr(String(e?.message || e || cp("Xatolik")));
    } finally {
      setLoading(false);
    }
  }, [cp, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const topup = useCallback(async () => {
    setErr("");
    try {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) return;
      await demoTopup(user.id, 10000);
      await load();
    } catch (e) {
      setErr(String(e?.message || e || cp("Xatolik")));
    }
  }, [cp, load]);

  const cardBrands = getWalletCardBrandOrder(paymentAssets);

  const pricingMoments = [
    { key: 'fair', label: cp("Barqaror narx"), icon: calculationAssets.pricing.fair },
    { key: 'surge', label: cp("Yuklama"), icon: calculationAssets.pricing.surgeUp },
    { key: 'discount', label: cp("Promo narx"), icon: calculationAssets.pricing.down },
  ];

  const paymentInsights = [
    {
      title: cp("Karta bilan to‘lash"),
      description: cp("Karta, wallet va promo balans bir oqimda ko‘rinadi."),
      icon: calculationAssets.payment.card,
    },
    {
      title: cp("To‘lov tafsilotlari"),
      description: cp("Trip yakunida narx tarkibi va chegirmalar alohida ko‘rsatiladi."),
      icon: calculationAssets.payment.details,
    },
    {
      title: cp("Promo balans"),
      description: cp("Aksiya va referral foydalari umumiy balans tajribasiga singadi."),
      icon: calculationAssets.promo.goalFlag,
    },
  ];

  return (
    <div className="unigo-page pb-8">
      <header className="unigo-topbar px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button type="button" className="unigo-soft-card flex h-11 w-11 items-center justify-center p-0" onClick={() => navigate('/client/home')}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-black text-slate-900">{cp("Hamyon", "wallet")}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 pt-5">
        <section className="unigo-dark-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Joriy balans</div>
              <div className="mt-3 text-3xl font-black text-white">{loading ? "…" : formatClientMoney(language, balance)}</div>
              <div className="mt-2 text-sm text-slate-300">To‘lovlar, kartalar va bonuslar shu hisobda yuritiladi</div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/10 p-3 text-white">
              <img src={securityAssets.payment.paymentWalletFill || securityAssets.payment.paymentWallet || paymentAssets.bonus.walletDefaultAlt || paymentAssets.bonus.walletDefault} alt="" className="h-full w-full object-contain" />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
              <img src={securityAssets.trust.trustCertificate} alt="" className="h-4 w-4" />
              Verified flow
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-200">
              <img src={securityAssets.notifications.notifyBellUnread} alt="" className="h-4 w-4" />
              Alerts ready
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-200">
              <img src={securityAssets.scanner.scanQrCode} alt="" className="h-4 w-4" />
              Scan pay
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_132px] md:items-center">
            <div className="flex items-center gap-3 rounded-[22px] bg-white/10 px-4 py-3">
              <img src={paymentAssets.bonus.walletDefaultAlt || paymentAssets.bonus.walletDefault} alt="" style={assetStyles.walletBonusImage} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white">Hamyon tayyor</div>
                <div className="text-xs leading-5 text-slate-300">Karta, bonus va promo to‘lovlari bir joyda jamlangan.</div>
              </div>
              <img src={paymentAssets.actions.scan} alt="" style={assetStyles.walletScanIcon} />
            </div>
            <div className="mx-auto flex h-[116px] w-[116px] items-center justify-center rounded-[24px] bg-white/8 p-2">
              <Lottie animationData={integratedAssets.payment.gooseDay} loop autoplay className="h-full w-full" />
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                <img src={calculationAssets.payment.pro} alt="" className="h-4 w-4 rounded-md object-cover" />
                <span>{cp("To‘lov va tarif ko‘rsatkichlari")}</span>
              </div>
              <div className="mt-3 text-lg font-black text-slate-900">{cp("Hamyonda pricing konteksti ham ko‘rinsin")}</div>
              <div className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                {cp("Safar narxi, promo foydasi va to‘lov tafsilotlari wallet ichida alohida bloklarda ko‘rinadigan qatlam qo‘shildi.")}
              </div>
            </div>
            <img src={calculationAssets.payment.details} alt="" className="h-16 w-16 rounded-2xl object-cover shadow-sm" />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {pricingMoments.map((item) => (
              <div key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <img src={item.icon} alt="" className="h-10 w-10 rounded-xl object-cover" />
                  <div className="text-sm font-bold text-slate-900">{item.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {paymentInsights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                <img src={item.icon} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                <div className="mt-3 text-sm font-bold text-slate-900">{item.title}</div>
                <div className="mt-1 text-xs leading-5 text-slate-600">{item.description}</div>
              </div>
            ))}
          </div>
        </section>



        <section className="grid gap-3 md:grid-cols-3">
          {essentialsFinanceCards.map((item) => (
            <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF]">
                <img src={item.icon} alt="" className="h-6 w-6 object-contain" />
              </div>
              <div className="mt-3 text-sm font-black text-slate-900">{item.title}</div>
              <div className="mt-2 text-xs leading-5 text-slate-500">{item.text}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <ActionTile icon={integratedAssets.payment.icons.topUp} title="Top up" text="Balansni tez to‘ldirish" onClick={topup} />
          <ActionTile icon={integratedAssets.payment.icons.withdraw} title="Refresh" text="Hamyon ma’lumotini yangilash" onClick={load} />
          <ActionTile icon={integratedAssets.payment.icons.split} title="Split" text="To‘lov oqimlari tayyorlangan" />
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" className="unigo-primary-btn min-h-[54px] px-5" onClick={topup}>Pul qo‘shish</button>
          <button type="button" className="unigo-secondary-btn min-h-[54px] px-5" onClick={load}>Balansni yangilash</button>
        </div>

        {err ? (
          <section className="rounded-[22px] border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-500">{err}</section>
        ) : null}

        <section className="grid gap-3 md:grid-cols-3">
          <article className="unigo-soft-card p-4">
            <img src={securityAssets.payment.paymentMethodUzcard} alt="" className="mb-3 h-10 w-10 object-contain" />
            <div className="text-sm font-black text-slate-900">Uzcard / Humo</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Mahalliy kartalar uchun tayyor visual qatlam.</p>
          </article>
          <article className="unigo-soft-card p-4">
            <img src={securityAssets.payment.paymentIconQr} alt="" className="mb-3 h-10 w-10 object-contain" />
            <div className="text-sm font-black text-slate-900">QR va Click/Payme</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Scan, show QR va tezkor to‘lov oqimlari uchun neutral iconlar.</p>
          </article>
          <article className="unigo-soft-card p-4">
            <img src={securityAssets.state.securityLockOutline} alt="" className="mb-3 h-10 w-10 object-contain" />
            <div className="text-sm font-black text-slate-900">Secure wallet</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Wallet ko‘rinishi xavfsizlik va trust holatlari bilan boyitildi.</p>
          </article>
        </section>

        <section className="unigo-soft-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">To‘lov usullari</div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {cardBrands.map((item) => (
                  <img key={item.key} src={item.src} alt={item.alt} className={assetSizes.walletCardBrand} />
                ))}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#F5F8FF]">
              <img src={paymentAssets.actions.addCardAlt || paymentAssets.actions.addCard} alt="" className={assetSizes.walletActionIcon} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600">
            <img src={paymentAssets.states.successAlt || paymentAssets.states.success} alt="" className={assetSizes.walletStateIcon} />
            <span>Karta ikonkalari, wallet statuslari va bonus visualari to‘liq integratsiya qilindi.</span>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <article className="unigo-soft-card p-4">
            <img src={securityAssets.payment.paymentMethodUzcard} alt="" className="mb-3 h-10 w-10 object-contain" />
            <div className="text-sm font-black text-slate-900">Uzcard / Humo</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Mahalliy kartalar uchun tayyor visual qatlam.</p>
          </article>
          <article className="unigo-soft-card p-4">
            <img src={securityAssets.payment.paymentIconQr} alt="" className="mb-3 h-10 w-10 object-contain" />
            <div className="text-sm font-black text-slate-900">QR va Click/Payme</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Scan, show QR va tezkor to‘lov oqimlari uchun neutral iconlar.</p>
          </article>
          <article className="unigo-soft-card p-4">
            <img src={securityAssets.state.securityLockOutline} alt="" className="mb-3 h-10 w-10 object-contain" />
            <div className="text-sm font-black text-slate-900">Secure wallet</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Wallet ko‘rinishi xavfsizlik va trust holatlari bilan boyitildi.</p>
          </article>
        </section>

        <section className="unigo-soft-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-base font-black text-slate-900">
                <img src={paymentAssets.bonus.loyaltyCardAlt || paymentAssets.bonus.loyaltyCard} alt="" style={assetStyles.walletLoyaltyIcon} />
                <span>Bonus va sodiqlik</span>
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-500">
                Bonuslar, promo balans va loyalty visualari wallet UI ichiga birlashtirildi. Keyingi tranzaksiyalarda shu yerda ko‘rinadi.
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                <img src={paymentAssets.states.warningAlt || paymentAssets.states.warning} alt="" className={assetSizes.walletStateIcon} />
                <span>Bonus bo‘limi tayyor, wallet flow bilan birga ishlaydi.</span>
              </div>
            </div>
            <img src={paymentAssets.bonus.bonusesImage || paymentAssets.bonus.bonusBadge} alt="" className={assetSizes.walletBonusImage} />
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <article className="unigo-soft-card p-4">
            <img src={securityAssets.payment.paymentMethodUzcard} alt="" className="mb-3 h-10 w-10 object-contain" />
            <div className="text-sm font-black text-slate-900">Uzcard / Humo</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Mahalliy kartalar uchun tayyor visual qatlam.</p>
          </article>
          <article className="unigo-soft-card p-4">
            <img src={securityAssets.payment.paymentIconQr} alt="" className="mb-3 h-10 w-10 object-contain" />
            <div className="text-sm font-black text-slate-900">QR va Click/Payme</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Scan, show QR va tezkor to‘lov oqimlari uchun neutral iconlar.</p>
          </article>
          <article className="unigo-soft-card p-4">
            <img src={securityAssets.state.securityLockOutline} alt="" className="mb-3 h-10 w-10 object-contain" />
            <div className="text-sm font-black text-slate-900">Secure wallet</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Wallet ko‘rinishi xavfsizlik va trust holatlari bilan boyitildi.</p>
          </article>
        </section>

        <section className="unigo-soft-card p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#EAF2FF] text-[#2F6BFF]">
              <span className="material-symbols-outlined">info</span>
            </div>
            <div>
              <div className="flex items-center gap-2 text-base font-black text-slate-900">
                <img src={supportAssets.history.receipt} alt="" className={assetSizes.walletHistoryIcon} />
                <span>Hozircha tranzaksiyalar yo‘q</span>
              </div>
              <div className="mt-1 text-sm leading-6 text-slate-500">
                Balansga pul qo‘shganingizdan yoki bonus olganingizdan keyin tarix shu yerda ko‘rinadi. Hisobotlarni ulashish uchun share/receipt assetlari tayyor.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ActionTile({ icon, title, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="unigo-soft-card flex min-h-[110px] flex-col items-start gap-3 p-4 text-left transition hover:-translate-y-0.5"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF2FF]">
        <img src={icon} alt="" className="h-5 w-5 object-contain" />
      </div>
      <div>
        <div className="text-sm font-black text-slate-900">{title}</div>
        <div className="mt-1 text-xs leading-5 text-slate-500">{text}</div>
      </div>
    </button>
  );
}
