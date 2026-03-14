import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase/supabaseClient';
import {
  demoTopup,
  getWalletBalance,
  getWalletTransactions,
  spendWalletFunds,
} from '@/services/walletApi';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';

function formatMoney(language, amount) {
  const normalizedAmount = Math.round(Number(amount || 0));
  try {
    return new Intl.NumberFormat(language === 'uz_kir' ? 'uz-Cyrl-UZ' : 'uz-UZ').format(normalizedAmount);
  } catch {
    return String(normalizedAmount);
  }
}

function getTxLabel(kind) {
  const normalizedKind = String(kind || '').trim().toLowerCase();
  if (normalizedKind === 'topup') return 'To‘ldirish';
  if (normalizedKind === 'spend') return 'Sarflash';
  if (normalizedKind === 'referral_bonus') return 'Referral bonusi';
  if (normalizedKind === 'bonus') return 'Bonus';
  if (normalizedKind === 'promo_bonus') return 'Promo bonusi';
  if (normalizedKind === 'manual_adjustment') return 'Qo‘lda o‘zgartirish';
  return normalizedKind || 'Tranzaksiya';
}

const UnifiedWalletPage = memo(function UnifiedWalletPage({
  homePath,
  title,
  roleLabel,
  referralPath,
  demoTopupAmount = 10000,
}) {
  const navigate = useNavigate();
  const { tr, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [walletState, setWalletState] = useState({
    userId: '',
    wallet: null,
    transactions: [],
  });
  const [spendState, setSpendState] = useState({
    amount_uzs: 1000,
    spend_mode: 'bonus_first',
    service_type: 'taxi',
  });
  const [errorText, setErrorText] = useState('');

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setErrorText('');
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const currentUser = authData?.user;
      if (!currentUser?.id) {
        navigate('/login', { replace: true });
        return;
      }

      const [walletResponse, transactions] = await Promise.all([
        getWalletBalance(currentUser.id),
        getWalletTransactions(currentUser.id),
      ]);

      setWalletState({
        userId: currentUser.id,
        wallet: walletResponse?.wallet || null,
        transactions: Array.isArray(transactions) ? transactions : [],
      });
    } catch (error) {
      setErrorText(String(error?.message || tr('error', 'Xatolik')));
    } finally {
      setLoading(false);
      setTransactionsLoading(false);
    }
  }, [navigate, tr]);

  useEffect(() => {
    let mounted = true;
    if (!mounted) return undefined;
    loadWallet();
    return () => {
      mounted = false;
    };
  }, [loadWallet]);

  const refreshTransactions = useCallback(async () => {
    if (!walletState.userId) return;
    setTransactionsLoading(true);
    try {
      const transactions = await getWalletTransactions(walletState.userId);
      setWalletState((current) => ({
        ...current,
        transactions: Array.isArray(transactions) ? transactions : [],
      }));
    } catch (error) {
      message.error(String(error?.message || tr('error', 'Xatolik')));
    } finally {
      setTransactionsLoading(false);
    }
  }, [tr, walletState.userId]);

  const handleTopup = useCallback(async () => {
    if (!walletState.userId) return;
    setSaving(true);
    setErrorText('');
    try {
      await demoTopup(walletState.userId, demoTopupAmount);
      await loadWallet();
      message.success(tr('wallet.demoTopupDone', 'Demo to‘ldirish bajarildi.'));
    } catch (error) {
      setErrorText(String(error?.message || tr('error', 'Xatolik')));
    } finally {
      setSaving(false);
    }
  }, [demoTopupAmount, loadWallet, tr, walletState.userId]);

  const handleSpendChange = useCallback((event) => {
    const { name, value } = event.target;
    setSpendState((current) => ({
      ...current,
      [name]: name === 'amount_uzs' ? Math.max(0, Math.round(Number(value || 0))) : value,
    }));
  }, []);

  const handleSpend = useCallback(async () => {
    if (!walletState.userId) return;
    if (Number(spendState.amount_uzs || 0) <= 0) {
      message.error(tr('wallet.amountRequired', 'Miqdorni kiriting.'));
      return;
    }

    setSaving(true);
    setErrorText('');
    try {
      await spendWalletFunds({
        user_id: walletState.userId,
        amount_uzs: spendState.amount_uzs,
        spend_mode: spendState.spend_mode,
        service_type: spendState.service_type,
        description: `${roleLabel || 'UniGo'} wallet spend`,
      });
      await loadWallet();
      message.success(tr('wallet.spendSuccess', 'Balansdan foydalanildi.'));
    } catch (error) {
      setErrorText(String(error?.message || tr('error', 'Xatolik')));
    } finally {
      setSaving(false);
    }
  }, [loadWallet, roleLabel, spendState.amount_uzs, spendState.service_type, spendState.spend_mode, tr, walletState.userId]);

  const mainBalance = useMemo(() => Number(walletState.wallet?.balance_uzs || 0), [walletState.wallet?.balance_uzs]);
  const bonusBalance = useMemo(() => Number(walletState.wallet?.bonus_balance_uzs || 0), [walletState.wallet?.bonus_balance_uzs]);
  const reservedBalance = useMemo(() => Number(walletState.wallet?.reserved_uzs || 0), [walletState.wallet?.reserved_uzs]);
  const totalEarned = useMemo(() => Number(walletState.wallet?.total_earned_uzs || 0), [walletState.wallet?.total_earned_uzs]);
  const totalSpent = useMemo(() => Number(walletState.wallet?.total_spent_uzs || 0), [walletState.wallet?.total_spent_uzs]);
  const mainBalanceLabel = useMemo(() => `${formatMoney(language, mainBalance)} ${tr('som', 'so‘m')}`, [language, mainBalance, tr]);
  const bonusBalanceLabel = useMemo(() => `${formatMoney(language, bonusBalance)} ${tr('som', 'so‘m')}`, [bonusBalance, language, tr]);
  const reservedBalanceLabel = useMemo(() => `${formatMoney(language, reservedBalance)} ${tr('som', 'so‘m')}`, [language, reservedBalance, tr]);
  const totalEarnedLabel = useMemo(() => `${formatMoney(language, totalEarned)} ${tr('som', 'so‘m')}`, [language, totalEarned, tr]);
  const totalSpentLabel = useMemo(() => `${formatMoney(language, totalSpent)} ${tr('som', 'so‘m')}`, [language, totalSpent, tr]);
  const spendModeText = useMemo(() => {
    if (spendState.spend_mode === 'bonus') return tr('wallet.bonusOnly', 'Faqat bonus balans');
    if (spendState.spend_mode === 'main') return tr('wallet.mainOnly', 'Faqat asosiy balans');
    return tr('wallet.bonusFirst', 'Avval bonus, keyin asosiy');
  }, [spendState.spend_mode, tr]);

  const goBack = useCallback(() => {
    navigate(homePath, { replace: true });
  }, [homePath, navigate]);

  const goReferral = useCallback(() => {
    if (referralPath) {
      navigate(referralPath);
    }
  }, [navigate, referralPath]);

  return (
    <div className="min-h-screen bg-softBlue dark:bg-backgroundDark font-display text-slate-900 dark:text-slate-100 p-4 pb-8">
      <div className="flex items-center justify-between mb-4 gap-3">
        <button type="button" className="neumorphic-dark px-3 py-2 rounded-xl text-primaryHome" onClick={goBack}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-center flex-1">{title}</h1>
        <button type="button" className="neumorphic-dark px-3 py-2 rounded-xl text-primaryHome" onClick={loadWallet} disabled={loading || saving}>
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      <div className="neumorphic-dark rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{tr('wallet.mainBalance', 'Asosiy balans')}</p>
            <div className="mt-2 text-3xl font-black text-primaryHome">{loading ? '…' : mainBalanceLabel}</div>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">{tr('bonusBalance', 'Bonus balansi')}</p>
            <div className="mt-2 text-2xl font-black text-amber-300">{loading ? '…' : bonusBalanceLabel}</div>
          </div>
          <button
            type="button"
            className="bg-primaryHome hover:bg-primaryHome/90 text-backgroundDark font-bold px-4 py-3 rounded-xl active:scale-95 disabled:opacity-50"
            onClick={goReferral}
            disabled={!referralPath}
          >
            {tr('inviteFriends', 'Do‘stlarni taklif qilish')}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-700 bg-backgroundDark/50 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{tr('wallet.reserved', 'Band qilingan')}</div>
            <div className="mt-2 text-lg font-bold text-slate-100">{loading ? '…' : reservedBalanceLabel}</div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-backgroundDark/50 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{tr('wallet.totalEarned', 'Jami tushum')}</div>
            <div className="mt-2 text-lg font-bold text-slate-100">{loading ? '…' : totalEarnedLabel}</div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-backgroundDark/50 px-4 py-3 col-span-2">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{tr('wallet.totalSpent', 'Jami sarflangan')}</div>
            <div className="mt-2 text-lg font-bold text-slate-100">{loading ? '…' : totalSpentLabel}</div>
          </div>
        </div>

        {errorText ? <p className="mt-4 text-sm text-red-400">{errorText}</p> : null}
      </div>

      <div className="mt-5 neumorphic-dark rounded-2xl p-5">
        <h2 className="text-base font-bold">{tr('wallet.spendRules', 'Balansdan foydalanish')}</h2>
        <p className="mt-2 text-sm text-slate-400 leading-6">
          {tr('wallet.globalSpendInfo', 'Bonus balans barcha xizmatlarda ishlatilishi uchun sarflash qatlami yagona hamyon orqali ishlaydi. Avval bonus yoki asosiy balansni tanlashingiz mumkin.')}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="sm:col-span-1">
            <span className="text-xs font-semibold text-slate-400">{tr('wallet.amount', 'Miqdor')}</span>
            <input
              name="amount_uzs"
              type="number"
              min="0"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-backgroundDark/50 px-4 py-3 text-slate-100 outline-none"
              value={spendState.amount_uzs}
              onChange={handleSpendChange}
            />
          </label>
          <label className="sm:col-span-1">
            <span className="text-xs font-semibold text-slate-400">{tr('wallet.source', 'To‘lov manbai')}</span>
            <select
              name="spend_mode"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-backgroundDark/50 px-4 py-3 text-slate-100 outline-none"
              value={spendState.spend_mode}
              onChange={handleSpendChange}
            >
              <option value="main">{tr('wallet.mainOnly', 'Faqat asosiy balans')}</option>
              <option value="bonus">{tr('wallet.bonusOnly', 'Faqat bonus balans')}</option>
              <option value="bonus_first">{tr('wallet.bonusFirst', 'Avval bonus, keyin asosiy')}</option>
            </select>
          </label>
          <label className="sm:col-span-1">
            <span className="text-xs font-semibold text-slate-400">{tr('service', 'Xizmat')}</span>
            <select
              name="service_type"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-backgroundDark/50 px-4 py-3 text-slate-100 outline-none"
              value={spendState.service_type}
              onChange={handleSpendChange}
            >
              <option value="taxi">Taxi</option>
              <option value="delivery">Delivery</option>
              <option value="cargo">Cargo</option>
              <option value="interprov">Interprov</option>
              <option value="district">District</option>
            </select>
          </label>
        </div>

        <p className="mt-3 text-xs text-slate-500">{spendModeText}</p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="flex-1 bg-primaryHome hover:bg-primaryHome/90 text-backgroundDark font-bold py-3 rounded-xl active:scale-95 disabled:opacity-50"
            onClick={handleSpend}
            disabled={saving || loading}
          >
            {saving ? tr('loading', 'Yuklanmoqda...') : tr('wallet.useBalance', 'Balansdan foydalanish')}
          </button>
          <button
            type="button"
            className="flex-1 neumorphic-inset-dark py-3 rounded-xl text-slate-200 font-semibold active:scale-95 disabled:opacity-50"
            onClick={handleTopup}
            disabled={saving || loading}
          >
            +{formatMoney(language, demoTopupAmount)} {tr('som', 'so‘m')} (demo)
          </button>
        </div>
      </div>

      <div className="mt-5 neumorphic-dark rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold">{tr('wallet.history', 'Hamyon tarixi')}</h2>
          <button
            type="button"
            className="neumorphic-inset-dark px-3 py-2 rounded-xl text-slate-200 font-semibold disabled:opacity-50"
            onClick={refreshTransactions}
            disabled={transactionsLoading}
          >
            {transactionsLoading ? tr('loading', 'Yuklanmoqda...') : tr('refresh', 'Yangilash')}
          </button>
        </div>

        {!walletState.transactions.length ? (
          <p className="mt-4 text-sm text-slate-400">{tr('wallet.emptyHistory', 'Hali tranzaksiyalar yo‘q.')}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {walletState.transactions.map((tx) => {
              const signedAmount = `${String(tx.direction || '').toLowerCase() === 'debit' ? '-' : '+'}${formatMoney(language, tx.amount_uzs)} ${tr('som', 'so‘m')}`;
              const balanceType = String(tx.metadata?.wallet_balance_type || '').trim();
              return (
                <div key={tx.id} className="rounded-2xl border border-slate-700 bg-backgroundDark/50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{tx.description || getTxLabel(tx.kind)}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {new Date(tx.created_at).toLocaleString()} · {tx.service_type || 'universal'}
                        {balanceType ? ` · ${balanceType}` : ''}
                      </div>
                    </div>
                    <div className={`text-sm font-black ${String(tx.direction || '').toLowerCase() === 'debit' ? 'text-red-400' : 'text-primaryHome'}`}>
                      {signedAmount}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default UnifiedWalletPage;
