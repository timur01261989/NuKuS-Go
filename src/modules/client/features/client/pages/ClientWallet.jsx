import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import { demoTopup, getWalletBalance } from "@/services/walletApi";
import { useClientText, formatClientMoney } from "../shared/i18n_clientLocalize";

export default function ClientWallet() {
  const navigate = useNavigate();
  const { cp, language } = useClientText();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [err, setErr] = useState("");

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

  useEffect(() => { load(); }, [load]);

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
              <div className="mt-3 text-3xl font-black text-white">{loading ? '…' : formatClientMoney(language, balance)}</div>
              <div className="mt-2 text-sm text-slate-300">To‘lovlar va bonuslar shu hisobda yuritiladi</div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/10 text-white">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" className="unigo-primary-btn min-h-[54px] px-5" onClick={topup}>Pul qo‘shish</button>
          <button type="button" className="unigo-secondary-btn min-h-[54px] px-5" onClick={load}>Balansni yangilash</button>
        </div>

        {err ? (
          <section className="rounded-[22px] border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-500">{err}</section>
        ) : null}

        <section className="unigo-soft-card p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#EAF2FF] text-[#2F6BFF]">
              <span className="material-symbols-outlined">info</span>
            </div>
            <div>
              <div className="text-base font-black text-slate-900">Hozircha tranzaksiyalar yo‘q</div>
              <div className="mt-1 text-sm leading-6 text-slate-500">Balansga pul qo‘shganingizdan yoki bonus olganingizdan keyin tarix shu yerda ko‘rinadi.</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
