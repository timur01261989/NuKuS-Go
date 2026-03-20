import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase/supabaseClient';
import { getWalletBalance } from '@/services/walletApi';
import { fetchDriverWalletTransactions } from '@/modules/driver/services/driverWalletService';

function formatMoney(value) {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  try {
    return `${new Intl.NumberFormat('uz-UZ').format(amount)} so‘m`;
  } catch {
    return `${amount} so‘m`;
  }
}

export default function DriverWalletPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [errorText, setErrorText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErrorText('');
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user?.id) {
        setErrorText('Foydalanuvchi aniqlanmadi');
        return;
      }

      const response = await getWalletBalance(user.id);
      setBalance(Number(response?.balance_uzs || response?.wallet?.balance_uzs || response?.wallet?.balance || 0));

      const txList = await fetchDriverWalletTransactions(user.id);
      setTransactions(Array.isArray(txList) ? txList : txList?.rows || txList?.items || []);
    } catch (error) {
      console.error('[DriverWalletPage] load error', error);
      setErrorText(String(error?.message || 'Hamyon ma’lumotini olishda xatolik yuz berdi'));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="unigo-page pb-8">
      <header className="unigo-topbar px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button type="button" onClick={() => navigate('/driver')} className="unigo-soft-card flex h-11 w-11 items-center justify-center p-0">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-black text-slate-900">Haydovchi hamyoni</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 pt-5">
        <section className="unigo-dark-card p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Joriy balans</div>
          <div className="mt-3 text-3xl font-black text-white">{loading ? '…' : formatMoney(balance)}</div>
          <div className="mt-2 text-sm text-slate-300">Haydovchi daromadi va bonuslar shu hisobda yuritiladi</div>
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" className="unigo-secondary-btn min-h-[54px] px-5" onClick={load}>Yangilash</button>
          <button type="button" className="unigo-secondary-btn min-h-[54px] px-5" onClick={() => navigate('/driver/orders')}>Buyurtmalar</button>
        </div>

        {errorText ? <section className="rounded-[22px] border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-500">{errorText}</section> : null}

        <section className="unigo-soft-card p-5">
          <div className="text-base font-black text-slate-900">Oxirgi tranzaksiyalar</div>
          {loading ? (
            <div className="mt-2 text-sm text-slate-500">Yuklanmoqda...</div>
          ) : transactions.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {transactions.slice(0, 8).map((tx, idx) => (
                <li key={tx.id || tx.transaction_id || idx} className="flex justify-between items-start gap-2">
                  <div>
                    <div className="text-sm font-semibold">{tx.description || tx.type || 'Tranzaksiya'}</div>
                    <div className="text-xs text-slate-500">{tx.created_at ? new Date(tx.created_at).toLocaleString() : ''}</div>
                  </div>
                  <div className={Number(tx.amount_uzs || tx.amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Number(tx.amount_uzs || tx.amount || 0).toLocaleString('uz-UZ')} so‘m
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 text-sm text-slate-500">Hozircha tranzaksiya tarixi mavjud emas.</div>
          )}
        </section>
      </main>
    </div>
  );
}
