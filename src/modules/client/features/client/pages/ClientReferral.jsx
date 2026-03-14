import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import { safeBack } from '@/modules/shared/navigation/safeBack.js';
import { getReferralSummary } from '@/services/referralApi.js';
import {
  buildReferralSharePayload,
  buildReferralShareTargets,
  buildReferralShareUrl,
  getShareCapabilities,
  openReferralShareTarget,
  shareReferralLink,
} from '@/services/referralLinkService.js';

function formatMoney(language, amount) {
  const normalizedAmount = Math.max(0, Math.round(Number(amount || 0)));
  try {
    return new Intl.NumberFormat(language === 'uz_kir' ? 'uz-Cyrl-UZ' : 'uz-UZ').format(normalizedAmount);
  } catch {
    return String(normalizedAmount);
  }
}

const ShareSheetModal = memo(function ShareSheetModal({
  open,
  title,
  subtitle,
  shareTargets,
  onClose,
  onSelect,
  selecting,
  tr,
}) {
  const visibleTargets = useMemo(() => Array.isArray(shareTargets) ? shareTargets : [], [shareTargets]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 px-4 py-6" onClick={onClose}>
      <div className="w-full max-w-xl rounded-[28px] border border-slate-700 bg-backgroundDark text-slate-100 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div>
            <h3 className="text-base font-bold">{title}</h3>
            <p className="mt-1 text-xs text-slate-400 leading-5">{subtitle}</p>
          </div>
          <button
            type="button"
            className="rounded-xl border border-slate-700 px-3 py-2 text-slate-300 transition hover:border-slate-500 hover:text-white"
            onClick={onClose}
          >
            {tr('close', 'Yopish')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          {visibleTargets.map((target) => (
            <button
              key={target.key}
              type="button"
              className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-5 text-center transition hover:border-primaryHome hover:bg-slate-900 disabled:opacity-60"
              onClick={() => onSelect(target)}
              disabled={selecting}
            >
              <div className="text-sm font-bold text-slate-100">{target.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

const ClientReferral = memo(function ClientReferral() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tr, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [summaryState, setSummaryState] = useState({
    code: null,
    summary: null,
    config: null,
  });
  const [errorText, setErrorText] = useState('');

  const isDriverView = useMemo(() => String(location.pathname || '').startsWith('/driver'), [location.pathname]);
  const fallbackHomePath = useMemo(() => (isDriverView ? '/driver' : '/client/home'), [isDriverView]);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setErrorText('');

    try {
      const response = await getReferralSummary();
      setSummaryState({
        code: response?.code || null,
        summary: response?.summary || null,
        config: response?.config || null,
      });
    } catch (error) {
      setErrorText(String(error?.message || tr('error', 'Xatolik')));
    } finally {
      setLoading(false);
    }
  }, [tr]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!mounted) return;
      await loadSummary();
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [loadSummary]);

  const referralCode = useMemo(() => String(summaryState?.code?.code || '').trim(), [summaryState?.code?.code]);
  const shareUrl = useMemo(() => buildReferralShareUrl(referralCode), [referralCode]);
  const shareCapabilities = useMemo(() => getShareCapabilities(), []);
  const shareTargets = useMemo(() => {
    const baseTargets = buildReferralShareTargets({ code: referralCode, appName: 'UniGo' });
    if (shareCapabilities.hasNavigatorShare) {
      return [{ key: 'more', label: tr('share', 'Ulashish'), mode: 'native-share' }, ...baseTargets];
    }
    return baseTargets;
  }, [referralCode, shareCapabilities.hasNavigatorShare, tr]);
  const wallet = useMemo(() => summaryState?.summary?.wallet || null, [summaryState?.summary?.wallet]);
  const totals = useMemo(() => ({
    invitedCount: Number(summaryState?.summary?.totals?.invited_count || 0),
    qualifiedCount: Number(summaryState?.summary?.totals?.qualified_count || 0),
    rewardedCount: Number(summaryState?.summary?.totals?.rewarded_count || 0),
    earnedUzs: Number(summaryState?.summary?.totals?.earned_uzs || 0),
  }), [summaryState?.summary?.totals]);
  const rewardRows = useMemo(() => Array.isArray(summaryState?.summary?.rewards) ? summaryState.summary.rewards.slice(0, 10) : [], [summaryState?.summary?.rewards]);
  const inviteBonusAmount = useMemo(() => Number(summaryState?.config?.referral?.reward_amount_uzs || 3000), [summaryState?.config?.referral?.reward_amount_uzs]);
  const inviteMinOrderAmount = useMemo(() => Number(summaryState?.config?.referral?.min_order_amount_uzs || 20000), [summaryState?.config?.referral?.min_order_amount_uzs]);
  const driverMilestoneTrips = useMemo(() => Number(summaryState?.config?.driver_milestone?.milestone_trips || 5), [summaryState?.config?.driver_milestone?.milestone_trips]);
  const driverMilestoneReward = useMemo(() => Number(summaryState?.config?.driver_milestone?.reward_amount_uzs || 10000), [summaryState?.config?.driver_milestone?.reward_amount_uzs]);
  const walletBonusLabel = useMemo(() => `${formatMoney(language, wallet?.bonus_balance_uzs || 0)} ${tr('som', 'so‘m')}`, [language, tr, wallet?.bonus_balance_uzs]);

  const closeShareSheet = useCallback(() => {
    if (sharing) {
      return;
    }
    setShareSheetOpen(false);
  }, [sharing]);

  const handleShare = useCallback(async () => {
    if (!shareUrl || !referralCode) {
      message.error(tr('referral.shareUnavailable', 'Taklif havolasi hali tayyor emas.'));
      return;
    }

    setShareSheetOpen(true);
  }, [referralCode, shareUrl, tr]);

  const handleShareTargetSelect = useCallback(async (target) => {
    setSharing(true);
    try {
      if (target?.key === 'more' && shareCapabilities.hasNavigatorShare) {
        const result = await shareReferralLink({ code: referralCode, appName: 'UniGo' });
        if (result.mode === 'native-share' || result.mode === 'cancelled') {
          setShareSheetOpen(false);
          return;
        }
        if (result.mode === 'clipboard') {
          message.success(tr('referral.linkCopied', 'Taklif havolasi nusxalandi.'));
          setShareSheetOpen(false);
          return;
        }
      }

      const result = await openReferralShareTarget(target);
      if (result.mode === 'clipboard') {
        message.success(tr('referral.linkCopied', 'Taklif havolasi nusxalandi.'));
      } else if (result.mode === 'popup') {
        message.success(tr('share', 'Ulashish oynasi ochildi.'));
      } else {
        message.info(tr('referral.copyFallback', 'Brauzer ulashishni ochmadi. Havolani nusxadan yuboring.'));
      }
      setShareSheetOpen(false);
    } catch (error) {
      message.error(String(error?.message || tr('error', 'Xatolik')));
    } finally {
      setSharing(false);
    }
  }, [referralCode, shareCapabilities.hasNavigatorShare, tr]);

  const sharePreviewText = useMemo(() => buildReferralSharePayload({ code: referralCode, appName: 'UniGo' }).text, [referralCode]);

  const backToHome = useCallback(() => {
    safeBack(navigate, fallbackHomePath);
  }, [fallbackHomePath, navigate]);

  const shareSheetSubtitle = useMemo(() => {
    if (shareCapabilities.hasNavigatorShare) {
      return tr('referral.shareSheetHint', 'Qurilmangiz qo‘llamasa, pastdagi ulashish variantlaridan foydalaning.');
    }
    return tr('referral.shareSheetFallbackHint', 'Brauzer otpravit oynasini ochmadi. Linkni shu yerdan yuboring.');
  }, [shareCapabilities.hasNavigatorShare, tr]);

  return (
    <div className="min-h-screen bg-softBlue dark:bg-backgroundDark font-display text-slate-900 dark:text-slate-100 p-4 pb-8">
      <ShareSheetModal
        open={shareSheetOpen}
        title={tr('shareReferral', 'Taklif ulashish')}
        subtitle={shareSheetSubtitle}
        shareTargets={shareTargets}
        onClose={closeShareSheet}
        onSelect={handleShareTargetSelect}
        selecting={sharing}
        tr={tr}
      />

      <div className="flex items-center justify-between mb-4 gap-3">
        <button type="button" className="neumorphic-dark px-3 py-2 rounded-xl text-primaryHome" onClick={backToHome}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-center flex-1">{tr('referralTitle', 'Do‘stlarni taklif qilish')}</h1>
        <button type="button" className="neumorphic-dark px-3 py-2 rounded-xl text-primaryHome" onClick={loadSummary} disabled={loading}>
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      <div className="neumorphic-dark rounded-2xl p-5">
        <p className="text-sm text-slate-300">{tr('inviteFriendsMsg', 'Do‘stlarni taklif qiling va ikkalangiz ham bonusga ega bo‘ling')}</p>

        <div className="mt-5 rounded-2xl bg-backgroundDark/60 border border-slate-700 p-4">
          <div className="text-xs text-slate-400 uppercase tracking-[0.18em]">{tr('referralCode', 'Taklif kodi')}</div>
          <div className="mt-2 text-2xl font-black tracking-[0.22em] text-primaryHome">{loading ? '…' : referralCode || '—'}</div>
          <div className="mt-4 text-xs text-slate-400 uppercase tracking-[0.18em]">{tr('referralLink', 'Taklif havolasi')}</div>
          <div className="mt-2 text-sm break-all text-slate-200">{shareUrl || '—'}</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-700 bg-backgroundDark/50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{tr('bonusBalance', 'Bonus balansi')}</div>
              <div className="mt-2 text-lg font-black text-amber-300">{walletBonusLabel}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-backgroundDark/50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{tr('referralRewards', 'Taklif mukofotlari')}</div>
              <div className="mt-2 text-lg font-black text-primaryHome">{formatMoney(language, totals.earnedUzs)} {tr('som', 'so‘m')}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="flex-1 bg-primaryHome hover:bg-primaryHome/90 text-backgroundDark font-bold py-3 rounded-xl active:scale-95 disabled:opacity-50"
            onClick={handleShare}
            disabled={loading || !referralCode || sharing}
          >
            {sharing ? tr('loading', 'Yuklanmoqda...') : tr('inviteFriends', 'Do‘stlarni taklif qilish')}
          </button>
          <button type="button" className="flex-1 neumorphic-inset-dark py-3 rounded-xl text-slate-200 font-semibold active:scale-95" onClick={loadSummary} disabled={loading}>
            {tr('refresh', 'Yangilash')}
          </button>
        </div>

        {errorText ? <p className="mt-4 text-sm text-red-400">{errorText}</p> : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="neumorphic-dark rounded-2xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-[0.18em]">{tr('referral.invitedCount', 'Taklif qilganlar')}</div>
          <div className="mt-2 text-2xl font-black text-primaryHome">{totals.invitedCount}</div>
        </div>
        <div className="neumorphic-dark rounded-2xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-[0.18em]">{tr('referral.qualifiedCount', 'Faol bo‘lganlar')}</div>
          <div className="mt-2 text-2xl font-black text-primaryHome">{totals.qualifiedCount}</div>
        </div>
        <div className="neumorphic-dark rounded-2xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-[0.18em]">{tr('referral.rewardedCount', 'Bonus olinganlar')}</div>
          <div className="mt-2 text-2xl font-black text-primaryHome">{totals.rewardedCount}</div>
        </div>
        <div className="neumorphic-dark rounded-2xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-[0.18em]">{tr('referral.driverProgram', 'Haydovchi bonusi')}</div>
          <div className="mt-2 text-xl font-black text-primaryHome">{formatMoney(language, driverMilestoneReward)} {tr('som', 'so‘m')}</div>
        </div>
      </div>

      <div className="mt-5 neumorphic-dark rounded-2xl p-5">
        <h2 className="text-base font-bold">{tr('referral.programRules', 'Referral dasturi qoidalari')}</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300 leading-6">
          <p>• {tr('referral.registerOnlyInfo', 'Referral kod faqat ro‘yxatdan o‘tish vaqtida bir marta biriktiriladi. Ro‘yxatdan o‘tgandan keyin qayta kiritilmaydi.')}</p>
          <p>• {formatMoney(language, inviteBonusAmount)} {tr('som', 'so‘m')} — oddiy taklif bonusi. U birinchi malakali buyurtma bajarilgandan keyin ishlaydi.</p>
          <p>• {formatMoney(language, inviteMinOrderAmount)} {tr('som', 'so‘m')} — referral kvalifikatsiyasi uchun minimal buyurtma qiymati.</p>
          <p>• {formatMoney(language, driverMilestoneReward)} {tr('som', 'so‘m')} — taklif qilingan haydovchi {driverMilestoneTrips} ta safarni tugatganda beriladigan qo‘shimcha bonus.</p>
          <p>• {tr('wallet.globalSpendInfo', 'Bonus balans barcha xizmatlarda ishlatilishi uchun sarflash qatlami yagona hamyon orqali ishlaydi. Avval bonus yoki asosiy balansni tanlashingiz mumkin.')}</p>
        </div>
      </div>

      <div className="mt-5 neumorphic-dark rounded-2xl p-5">
        <h2 className="text-base font-bold">{tr('shareReferral', 'Taklif ulashish')}</h2>
        <p className="mt-2 text-sm text-slate-400 leading-6">{sharePreviewText}</p>
      </div>

      <div className="mt-5 neumorphic-dark rounded-2xl p-5">
        <h2 className="text-base font-bold">{tr('referralRewards', 'Taklif mukofotlari')}</h2>
        {rewardRows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">{tr('referral.noRewardsYet', 'Hali referral bonuslar yo‘q.')}</p>
        ) : (
          <div className="mt-3 space-y-3">
            {rewardRows.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-700 bg-backgroundDark/50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{tr('referralBonus', 'Taklif bonusi')}</div>
                    <div className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-base font-black text-primaryHome">+{formatMoney(language, item.amount_uzs)} {tr('som', 'so‘m')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default ClientReferral;
