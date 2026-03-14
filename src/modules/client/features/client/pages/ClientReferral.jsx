import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import { safeBack } from '@/modules/shared/navigation/safeBack.js';
import { bootstrapReferralSummary, getReferralSummary } from '@/services/referralApi.js';
import {
  buildReferralSharePayload,
  buildReferralShareUrl,
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

const ClientReferral = memo(function ClientReferral() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tr, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [summaryState, setSummaryState] = useState({
    code: null,
    summary: null,
    shareUrl: '',
    wallet: null,
  });
  const [errorText, setErrorText] = useState('');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setErrorText('');

    try {
      let response = await getReferralSummary();
      const currentCode = String(response?.code?.code || response?.code || '').trim();
      if (!currentCode) {
        response = await bootstrapReferralSummary();
      }
      setSummaryState({
        code: response?.code || null,
        summary: response?.summary || null,
        shareUrl: String(response?.share_url || '').trim(),
        wallet: response?.wallet || null,
      });
    } catch (error) {
      setErrorText(String(error?.message || tr('error', 'Xatolik')));
      setSummaryState({
        code: null,
        summary: null,
        shareUrl: '',
        wallet: null,
      });
    } finally {
      setLoading(false);
    }
  }, [tr]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!mounted) {
        return;
      }
      await loadSummary();
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [loadSummary]);

  const referralCode = useMemo(() => String(summaryState?.code?.code || summaryState?.code || '').trim(), [summaryState?.code]);
  const shareUrl = useMemo(() => String(summaryState?.shareUrl || '').trim() || buildReferralShareUrl(referralCode), [referralCode, summaryState?.shareUrl]);
  const totals = useMemo(() => {
    return {
      invitedCount: Number(summaryState?.summary?.totals?.invited_count || 0),
      qualifiedCount: Number(summaryState?.summary?.totals?.qualified_count || 0),
      rewardedCount: Number(summaryState?.summary?.totals?.rewarded_count || 0),
      earnedUzs: Number(summaryState?.summary?.totals?.earned_uzs || 0),
      bonusBalanceUzs: Number(summaryState?.wallet?.bonus_balance_uzs || 0),
    };
  }, [summaryState?.summary?.totals, summaryState?.wallet]);

  const rewardRows = useMemo(() => {
    return Array.isArray(summaryState?.summary?.rewards) ? summaryState.summary.rewards.slice(0, 10) : [];
  }, [summaryState?.summary?.rewards]);

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) {
      message.error(tr('referral.shareUnavailable', 'Taklif havolasi hali tayyor emas.'));
      return;
    }

    setSharing(true);
    try {
      const result = await shareReferralLink({ code: referralCode, appName: 'UniGo' });
      if (result.mode === 'clipboard') {
        message.success(tr('referral.linkCopied', 'Taklif havolasi nusxalandi.'));
        return;
      }
      if (result.mode === 'native-share') {
        message.success(tr('share', 'Ulashish'));
        return;
      }
      if (result.mode === 'cancelled') {
        return;
      }
      message.info(tr('referral.copyFallback', 'Havolani qo‘lda nusxalab yuboring.'));
    } catch (error) {
      message.error(String(error?.message || tr('error', 'Xatolik')));
    } finally {
      setSharing(false);
    }
  }, [referralCode, shareUrl, tr]);

  const sharePreviewText = useMemo(() => {
    const payload = buildReferralSharePayload({
      code: referralCode,
      appName: 'UniGo',
    });
    return payload.text;
  }, [referralCode]);

  const backToHome = useCallback(() => {
    const fallbackPath = String(location?.pathname || '').startsWith('/driver') ? '/driver' : '/client/home';
    safeBack(navigate, fallbackPath);
  }, [location?.pathname, navigate]);

  return (
    <div className="min-h-screen bg-softBlue dark:bg-backgroundDark font-display text-slate-900 dark:text-slate-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          className="neumorphic-dark px-3 py-2 rounded-xl text-primaryHome"
          onClick={backToHome}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">{tr('referralTitle', 'Do‘stlarni taklif qilish')}</h1>
        <button
          type="button"
          className="neumorphic-dark px-3 py-2 rounded-xl text-primaryHome"
          onClick={loadSummary}
          disabled={loading}
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      <div className="neumorphic-dark rounded-2xl p-5">
        <p className="text-sm text-slate-300">{tr('inviteFriendsMsg', 'Do‘stlarni taklif qiling va ikkalangiz ham bonusga ega bo‘ling')}</p>

        <div className="mt-5 rounded-2xl bg-backgroundDark/60 border border-slate-700 p-4">
          <div className="text-xs text-slate-400 uppercase tracking-[0.18em]">{tr('referralCode', 'Taklif kodi')}</div>
          <div className="mt-2 text-2xl font-black tracking-[0.22em] text-primaryHome">
            {loading ? '…' : referralCode || '—'}
          </div>
          <div className="mt-4 text-xs text-slate-400 uppercase tracking-[0.18em]">{tr('referralLink', 'Taklif havolasi')}</div>
          <div className="mt-2 text-sm break-all text-slate-200">{shareUrl || '—'}</div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="flex-1 bg-primaryHome hover:bg-primaryHome/90 text-backgroundDark font-bold py-3 rounded-xl active:scale-95 disabled:opacity-50"
            onClick={handleCopyLink}
            disabled={loading || !referralCode || sharing}
          >
            {sharing ? tr('loading', 'Yuklanmoqda...') : tr('inviteFriends', 'Do‘stlarni taklif qilish')}
          </button>
          <button
            type="button"
            className="flex-1 neumorphic-inset-dark py-3 rounded-xl text-slate-200 font-semibold active:scale-95"
            onClick={loadSummary}
            disabled={loading}
          >
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
          <div className="text-xs text-slate-400 uppercase tracking-[0.18em]">{tr('wallet.bonusBalance', 'Bonus balansi')}</div>
          <div className="mt-2 text-2xl font-black text-primaryHome">{formatMoney(language, totals.bonusBalanceUzs)} {tr('som', 'so‘m')}</div>
        </div>
        <div className="neumorphic-dark rounded-2xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-[0.18em]">{tr('referralRewards', 'Taklif mukofotlari')}</div>
          <div className="mt-2 text-2xl font-black text-primaryHome">{formatMoney(language, totals.earnedUzs)} {tr('som', 'so‘m')}</div>
        </div>
      </div>

      <div className="mt-5 neumorphic-dark rounded-2xl p-5">
        <h2 className="text-base font-bold">{tr('shareReferral', 'Taklif ulashish')}</h2>
        <p className="mt-2 text-sm text-slate-400 leading-6">{sharePreviewText}</p>
        <p className="mt-4 text-xs text-slate-500 leading-5">
          {tr('referral.registerOnlyInfo', 'Referral kod faqat ro‘yxatdan o‘tish vaqtida bir marta biriktiriladi. Ro‘yxatdan o‘tgandan keyin qayta kiritilmaydi.')}
        </p>
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
                    <div className="mt-1 text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
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
