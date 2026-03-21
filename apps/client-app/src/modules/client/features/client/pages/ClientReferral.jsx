import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import { safeBack } from '@/modules/shared/navigation/safeBack.js';
import { bootstrapReferralSummary, getReferralSummary } from '@/services/referralApi.js';
import {
  buildReferralExternalShareTargets,
  buildReferralSharePayload,
  buildReferralShareUrl,
  getOwnReferralSnapshot,
  persistOwnReferralSnapshot,
  shareReferralLink,
} from '@/services/referralLinkService.js';
import { formatMoney, mergeReferralState } from './clientReferral.helpers.js';
import { buildInlineStatusText, buildReferralViewModel, buildWarningsText, getInitialReferralSummaryState } from './clientReferral.logic.js';
import { promoAssets } from '@/assets/promo';
import { assetStyles } from '@/assets/assetPolish';


const ClientReferral = memo(function ClientReferral() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tr, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [codeStatus, setCodeStatus] = useState('loading');
  const [summaryState, setSummaryState] = useState(() => getInitialReferralSummaryState(getOwnReferralSnapshot));

  const {
    referralCode,
    shareUrl,
    sharePayload,
    externalTargets,
    canShare,
    totals,
    rewardRows,
  } = useMemo(
    () => buildReferralViewModel(summaryState, buildReferralShareUrl, buildReferralSharePayload, buildReferralExternalShareTargets),
    [summaryState]
  );
  const canAttemptShare = useMemo(() => !loading && !sharing, [loading, sharing]);


  const closeShareSheet = useCallback(() => {
    setShareSheetOpen(false);
  }, []);

  const applyResponse = useCallback((response) => {
    setSummaryState((previousState) => mergeReferralState(response, previousState));
    const normalizedCode = String(response?.code?.code || response?.code || '').trim();
    setCodeStatus(normalizedCode ? 'ready' : 'loading');
  }, []);

  const loadSummary = useCallback(async (mode = 'summary') => {
    setLoading(true);
    setErrorText('');
    if (!referralCode) {
      setCodeStatus('loading');
    }

    try {
      const response = mode === 'bootstrap'
        ? await bootstrapReferralSummary()
        : await getReferralSummary();
      applyResponse(response);
    } catch (error) {
      setErrorText(String(error?.message || tr('error', 'Xatolik')));
      setCodeStatus('error');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [applyResponse, referralCode, tr]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const cached = getOwnReferralSnapshot();
        if (mounted && cached?.code) {
          setCodeStatus('ready');
          setLoading(false);
        }
        await loadSummary('summary');
      } catch {
        try {
          await loadSummary('bootstrap');
        } catch {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadSummary]);

  const openExternalShareTarget = useCallback((targetUrl) => {
    const safeUrl = String(targetUrl || '').trim();
    if (!safeUrl) {
      message.error(tr('referral.shareUnavailable', 'Taklif havolasi hali tayyor emas.'));
      return;
    }
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
  }, [tr]);

  const handleCopyLink = useCallback(async () => {
    if (!canShare) {
      try {
        const response = await bootstrapReferralSummary();
        applyResponse(response);
      } catch (bootstrapError) {
        message.error(String(bootstrapError?.message || tr('referral.shareUnavailable', 'Taklif havolasi hali tayyor emas.')));
        return;
      }
    }

    const latestCode = String(summaryState?.code?.code || summaryState?.code || referralCode || '').trim();
    const latestShareUrl = String(summaryState?.shareUrl || '').trim() || buildReferralShareUrl(latestCode);
    if (!latestCode || !latestShareUrl) {
      message.error(tr('referral.shareUnavailable', 'Taklif havolasi hali tayyor emas.'));
      return;
    }

    setSharing(true);
    try {
      if (window?.navigator?.share) {
        const result = await shareReferralLink({ code: latestCode, appName: 'UniGo' });
        if (result.mode === 'native-share') {
          return;
        }
        if (result.mode === 'clipboard') {
          message.success(tr('referral.linkCopied', 'Taklif havolasi nusxalandi.'));
          return;
        }
        if (result.mode === 'cancelled') {
          return;
        }
      }
      setShareSheetOpen(true);
    } catch (error) {
      message.error(String(error?.message || tr('error', 'Xatolik')));
    } finally {
      setSharing(false);
    }
  }, [applyResponse, canShare, referralCode, summaryState?.code, summaryState?.shareUrl, tr]);

  const handleRefresh = useCallback(async () => {
    try {
      await loadSummary('bootstrap');
    } catch {
      // loadSummary already surfaced error state
    }
  }, [loadSummary]);

  const backToHome = useCallback(() => {
    const fallbackPath = String(location?.pathname || '').startsWith('/driver') ? '/driver' : '/client/home';
    safeBack(navigate, fallbackPath);
  }, [location?.pathname, navigate]);

  const inlineStatusText = useMemo(
    () => buildInlineStatusText({ loading, codeStatus, errorText, tr }),
    [loading, codeStatus, errorText, tr]
  );

  const warningsText = useMemo(() => buildWarningsText(summaryState), [summaryState]);


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
          onClick={handleRefresh}
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
            {loading && !referralCode ? '…' : referralCode || '—'}
          </div>
          <div className="mt-4 text-xs text-slate-400 uppercase tracking-[0.18em]">{tr('referralLink', 'Taklif havolasi')}</div>
          <div className="mt-2 text-sm break-all text-slate-200">{shareUrl || '—'}</div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="flex-1 bg-primaryHome hover:bg-primaryHome/90 text-backgroundDark font-bold py-3 rounded-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            onClick={handleCopyLink}
            disabled={!canAttemptShare}
          >
            <img src={promoAssets.shareIcon || promoAssets.share} alt="" style={assetStyles.promoActionIcon} />
            {sharing ? tr('loading', 'Yuklanmoqda...') : tr('inviteFriends', 'Do‘stlarni taklif qilish')}
          </button>
          <button
            type="button"
            className="flex-1 neumorphic-inset-dark py-3 rounded-xl text-slate-200 font-semibold active:scale-95"
            onClick={handleRefresh}
            disabled={loading}
          >
            {tr('refresh', 'Yangilash')}
          </button>
        </div>

        <p className={`mt-4 text-sm ${codeStatus === 'error' ? 'text-red-400' : 'text-slate-400'}`}>{inlineStatusText}</p>
        {errorText ? <p className="mt-2 text-sm text-red-400">{errorText}</p> : null}
        {warningsText ? <p className="mt-2 text-xs text-amber-400">{warningsText}</p> : null}
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
        <h2 className="text-base font-bold flex items-center gap-2"><img src={promoAssets.promoCode} alt="" style={assetStyles.promoBonusImage} />{tr('shareReferral', 'Taklif ulashish')}</h2>
        <p className="mt-2 text-sm text-slate-400 leading-6">{sharePayload.text}</p>
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

      {shareSheetOpen ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={closeShareSheet}>
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-backgroundDark p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{tr('shareReferral', 'Taklif ulashish')}</h3>
                <p className="mt-1 text-sm text-slate-400">{shareUrl || '—'}</p>
              </div>
              <button type="button" className="rounded-xl border border-slate-700 px-3 py-2 text-slate-200" onClick={closeShareSheet}>×</button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" className="rounded-2xl bg-primaryHome px-4 py-3 font-bold text-backgroundDark" onClick={() => openExternalShareTarget(externalTargets.telegram)}>Telegram</button>
              <button type="button" className="rounded-2xl bg-primaryHome px-4 py-3 font-bold text-backgroundDark" onClick={() => openExternalShareTarget(externalTargets.whatsapp)}>WhatsApp</button>
              <button type="button" className="rounded-2xl bg-primaryHome px-4 py-3 font-bold text-backgroundDark" onClick={() => openExternalShareTarget(externalTargets.vk)}>VK</button>
              <button
                type="button"
                className="rounded-2xl border border-slate-700 px-4 py-3 font-semibold text-slate-100"
                onClick={async () => {
                  const result = await shareReferralLink({ code: referralCode, appName: 'UniGo' });
                  if (result.mode === 'clipboard') {
                    message.success(tr('referral.linkCopied', 'Taklif havolasi nusxalandi.'));
                  }
                  closeShareSheet();
                }}
              >
                {tr('copyLink', 'Nusxa olish')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default ClientReferral;
