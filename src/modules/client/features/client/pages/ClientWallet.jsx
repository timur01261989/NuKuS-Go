import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { demoTopup, getWalletBalance } from "@/services/walletApi";
import { useClientText, formatClientMoney } from "../shared/i18n_clientLocalize";

export default function ClientWallet() {
  const navigate = useNavigate();
  const { cp, language } = useClientText();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [err, setErr] = useState("");

  const load = async () => {
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
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topup = async () => {
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
  };

  const balanceLabel = formatClientMoney(language, balance);

  return (
    <div className="min-h-screen bg-softBlue dark:bg-backgroundDark font-display text-slate-900 dark:text-slate-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          className="neumorphic-dark px-3 py-2 rounded-xl text-primaryHome"
          onClick={() => navigate("/client/home")}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">{cp("Hamyon", "wallet")}</h1>
        <div className="w-10" />
      </div>

      <div className="neumorphic-dark rounded-2xl p-5">
        <p className="text-xs text-slate-400">{cp("Joriy balans")}</p>
        <div className="mt-2 text-3xl font-extrabold text-primaryHome">{loading ? "…" : balanceLabel}</div>
        {err ? <p className="mt-3 text-sm text-red-400">{err}</p> : null}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="flex-1 bg-primaryHome hover:bg-primaryHome/90 text-backgroundDark font-bold py-3 rounded-xl active:scale-95"
            onClick={topup}
          >
            +10 000 {cp("so'm")} (demo)
          </button>
          <button
            type="button"
            className="flex-1 neumorphic-inset-dark py-3 rounded-xl text-slate-200 font-semibold active:scale-95"
            onClick={load}
          >
            {cp("Yangilash")}
          </button>
        </div>
      </div>

      <div className="mt-6 text-xs text-slate-400">
        {cp("Eslatma: demo hamyon backend yoqilgan bo‘lsa ishlaydi. Agar API yo‘q bo‘lsa, bu sahifa balansni ko‘rsata olmaydi.")}
      </div>
    </div>
  );
}
