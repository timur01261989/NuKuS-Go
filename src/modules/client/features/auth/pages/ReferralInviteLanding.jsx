import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { message } from 'antd';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import { resolveReferralCode } from '@/services/referralApi.js';
import {
  buildReferralShareUrl,
  createPendingReferralContext,
  persistPendingReferralContext,
  normalizeReferralCode,
} from '@/services/referralLinkService.js';

const ReferralInviteLanding = memo(function ReferralInviteLanding() {
  const navigate = useNavigate();
  const { code: rawCode } = useParams();
  const { tr } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [inviteState, setInviteState] = useState({
    valid: false,
    code: normalizeReferralCode(rawCode),
    inviter: null,
    error: '',
  });

  const normalizedCode = useMemo(() => normalizeReferralCode(rawCode), [rawCode]);

  useEffect(() => {
    let mounted = true;

    async function loadInvitePreview() {
      if (!normalizedCode) {
        if (!mounted) return;
        setInviteState({
          valid: false,
          code: '',
          inviter: null,
          error: tr('referral.invalidLink', 'Taklif havolasi noto‘g‘ri.'),
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await resolveReferralCode(normalizedCode);
        const context = createPendingReferralContext({
          code: response?.code?.code || normalizedCode,
          source: 'invite-link',
          shareUrl: buildReferralShareUrl(response?.code?.code || normalizedCode),
          inviter: response?.inviter || null,
        });
        persistPendingReferralContext(context);

        if (!mounted) return;
        setInviteState({
          valid: !!response?.valid,
          code: response?.code?.code || normalizedCode,
          inviter: response?.inviter || null,
          error: '',
        });
      } catch (error) {
        if (!mounted) return;
        setInviteState({
          valid: false,
          code: normalizedCode,
          inviter: null,
          error: String(error?.message || tr('referral.invalidLink', 'Taklif havolasi noto‘g‘ri.')),
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadInvitePreview();

    return () => {
      mounted = false;
    };
  }, [normalizedCode, tr]);

  const inviterName = useMemo(() => {
    return String(inviteState?.inviter?.full_name || tr('referral.inviterFallback', 'UniGo foydalanuvchisi')).trim();
  }, [inviteState?.inviter?.full_name, tr]);

  const openRegistration = useCallback(() => {
    if (!inviteState?.code) {
      message.error(tr('referral.invalidLink', 'Taklif havolasi noto‘g‘ri.'));
      return;
    }

    persistPendingReferralContext({
      code: inviteState.code,
      source: 'invite-link',
      shareUrl: buildReferralShareUrl(inviteState.code),
      inviter: inviteState.inviter || null,
    });
    navigate(`/register?ref=${encodeURIComponent(inviteState.code)}`, { replace: true });
  }, [inviteState.code, inviteState.inviter, navigate, tr]);

  const openHome = useCallback(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#E3EDF7] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] p-8 bg-white/80 shadow-[20px_20px_60px_#c5d0da,-20px_-20px_60px_#ffffff] border border-white/60">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#ec5b13]/10 flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-[38px] text-[#ec5b13]">card_giftcard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">UniGo</h1>
          <p className="mt-2 text-sm text-slate-500">
            {tr('inviteFriendsMsg', 'Do‘stlarni taklif qiling va ikkalangiz ham bonusga ega bo‘ling')}
          </p>
        </div>

        <div className="mt-8 rounded-3xl bg-slate-50 border border-slate-100 p-5 text-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-8 h-8 border-4 border-[#ec5b13] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">{tr('loading', 'Yuklanmoqda...')}</p>
            </div>
          ) : inviteState.valid ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {tr('referralTitle', 'Do‘stlarni taklif qilish')}
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">{inviterName}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {tr('referral.registerViaInvite', 'Siz uchun maxsus taklif havolasi tayyor. Ro‘yxatdan o‘tsangiz referral avtomatik biriktiriladi.')}
              </p>
              <div className="mt-5 rounded-2xl bg-white border border-slate-200 px-4 py-3">
                <div className="text-xs text-slate-400 uppercase tracking-[0.18em]">{tr('referralCode', 'Taklif kodi')}</div>
                <div className="mt-1 text-lg font-black tracking-[0.2em] text-[#ec5b13]">{inviteState.code}</div>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
                {tr('referral.invalidLinkTitle', 'Taklif havolasi topilmadi')}
              </p>
              <p className="mt-3 text-sm text-slate-500">{inviteState.error || tr('referral.invalidLink', 'Taklif havolasi noto‘g‘ri.')}</p>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={openRegistration}
            disabled={!inviteState.valid || loading}
            className="w-full rounded-2xl bg-[#ec5b13] text-white font-bold py-4 shadow-lg shadow-[#ec5b13]/20 hover:bg-[#d44d0a] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tr('register', 'Ro‘yxatdan o‘tish')}
          </button>
          <button
            type="button"
            onClick={openHome}
            className="w-full rounded-2xl bg-white text-slate-700 font-semibold py-4 border border-slate-200 hover:bg-slate-50 active:scale-[0.99] transition-all"
          >
            {tr('login', 'Kirish')}
          </button>
        </div>

        <p className="mt-5 text-xs text-center text-slate-400 leading-5">
          {tr('referral.registerOnlyInfo', 'Referral kod faqat ro‘yxatdan o‘tish vaqtida bir marta biriktiriladi. Ro‘yxatdan o‘tgandan keyin qayta kiritilmaydi.')}
        </p>
      </div>
    </div>
  );
});

export default ReferralInviteLanding;
