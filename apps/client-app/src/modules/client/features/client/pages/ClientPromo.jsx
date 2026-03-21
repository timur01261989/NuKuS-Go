import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validatePromo } from '@/services/promoApi';
import { useClientText } from '../shared/i18n_clientLocalize';
import { safeBack } from '@/modules/shared/navigation/safeBack';
import { integratedAssets } from '@/assets/integrated';
import { calculationAssets } from '@/assets/calculation';
import { promoCalculationPatterns } from './clientPromoGuidance';
import { essentialsAssets } from '@/assets/essentials';
import { loyaltyTiers, buildRewardsDashboard } from './clientRewardsServicesGuidance';

export default function ClientPromo() {
  const navigate = useNavigate();
  const { t, cp } = useClientText();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const medals = useMemo(() => [
    integratedAssets.promo.medals.bronze,
    integratedAssets.promo.medals.silver,
    integratedAssets.promo.medals.gold,
    integratedAssets.promo.medals.platinum,
  ], []);


  const essentialsRewardCards = useMemo(() => ([
    { icon: essentialsAssets.loyalty.loyaltyReward, title: cp('Mukofot progressi'), text: cp('Promo, reward va debt holatlarini bitta dashboardda ko‘rsatadi.') },
    { icon: essentialsAssets.loyalty.debtWarning, title: cp('Ogohlantirish nazorati'), text: cp('Qarzdorlik yoki cheklov holatlari uchun alohida signal.') },
    { icon: essentialsAssets.auto.serviceGarageFill, title: cp('Servis bonuslari'), text: cp('Garage va auto-service reward oqimlari bilan birga ishlaydi.') },
  ]), [cp]);

  const rewardsDashboard = useMemo(() => buildRewardsDashboard({ debt: result?.discount ? 0 : 1, tier: result?.valid ? 'gold' : 'bronze' }), [result]);

  const check = async () => {
    setErr('');
    setResult(null);
    const c = code.trim();
    if (!c) return;
    setLoading(true);
    try {
      const j = await validatePromo(c, 100000);
      setResult(j);
    } catch (e) {
      setErr(String(e?.message || e || t.error || cp('Xatolik')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => safeBack(navigate, '/client/home')}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium"
        >
          ←
        </button>
        <div>
          <div className="text-base font-semibold">{cp('Promo va takliflar')}</div>
          <div className="text-xs text-slate-500">{cp('Kod, aksiya va referral foydalari')}</div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-4">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <img src={calculationAssets.promo.badgeFill} alt="" className="h-4 w-4" />
                <span>{cp('Promo markazi')}</span>
              </div>
              <h1 className="mt-3 text-2xl font-bold">{cp('Chegirma va takliflarni bir joyda boshqaring')}</h1>
              <p className="mt-2 text-sm text-white/85">
                {cp('Promokod kiriting, referral foydasini ko‘ring va faol aksiyalarni kuzating.')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <img src={calculationAssets.promo.codeEntry} alt="" className="h-8 w-8" />
                <div className="mt-2 text-sm font-semibold">{cp('Kod kiritish')}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <img src={calculationAssets.promo.goalFlag} alt="" className="h-8 w-8 rounded-md object-cover" />
                <div className="mt-2 text-sm font-semibold">{cp('Faol aksiya')}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {promoCalculationPatterns.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <img src={calculationAssets.promo.badgeOutline} alt="" className="h-5 w-5" />
                <span>{item.title}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {essentialsRewardCards.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <img src={item.icon} alt="" className="h-10 w-10 object-contain" />
              <div className="mt-3 text-sm font-semibold text-slate-900">{item.title}</div>
              <div className="mt-2 text-xs leading-5 text-slate-500">{item.text}</div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{cp('Reward va servis darajalari')}</div>
              <div className="mt-1 text-sm text-slate-500">{cp('Promo, debt va servis kartalari yagona daraja tizimida ko‘rinadi')}</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              <img src={essentialsAssets.loyalty.loyaltyRewardBadge} alt="" className="h-4 w-4" />
              <span>{rewardsDashboard.tier}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {loyaltyTiers.map((tier) => (
              <div key={tier.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <img
                  src={tier.key === 'bronze' ? essentialsAssets.loyalty.tierBronze : tier.key === 'silver' ? essentialsAssets.loyalty.tierSilver : tier.key === 'gold' ? essentialsAssets.loyalty.tierGold : essentialsAssets.loyalty.tierPlatinum}
                  alt=""
                  className="h-10 w-10 object-contain"
                />
                <div className="mt-2 text-sm font-semibold text-slate-900">{tier.title}</div>
                <div className="text-xs text-slate-500">{tier.rewardState}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{cp('Promokodni tekshirish')}</div>
              <div className="mt-1 text-sm text-slate-500">{cp('Kod kiriting va foyda holatini ko‘ring')}</div>
            </div>
            <img src={calculationAssets.promo.referralCode} alt="" className="h-12 w-12 rounded-xl object-cover" />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={cp('Promokod kiriting')}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
            />
            <button
              type="button"
              onClick={check}
              disabled={loading}
              className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? cp('Tekshirilmoqda...') : cp('Tekshirish')}
            </button>
          </div>

          {err ? <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div> : null}
          {result ? (
            <div className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {cp('Kod qabul qilindi')}: {JSON.stringify(result)}
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-lg font-semibold">{cp('Mukofot darajalari')}</div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {medals.map((src, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 p-3 text-center">
                <img src={src} alt="" className="mx-auto h-12 w-12 object-contain" />
                <div className="mt-2 text-xs text-slate-500">{cp('Daraja')} {index + 1}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
