import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validatePromo } from "@/services/promoApi";

export default function ClientPromo() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const check = async () => {
    setErr("");
    setResult(null);
    const c = code.trim();
    if (!c) return;
    setLoading(true);
    try {
      // order_total_uzs: demo qiymat. Keyin buyurtma summasidan berib yuboriladi.
      const j = await validatePromo(c, 100000);
      setResult(j);
    } catch (e) {
      setErr(String(e?.message || e || "Xatolik"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-softBlue dark:bg-backgroundDark font-display text-slate-900 dark:text-slate-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          className="neumorphic-dark px-3 py-2 rounded-xl text-primaryHome"
          onClick={() => navigate(-1)}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">Promokodlar</h1>
        <div className="w-10" />
      </div>

      <div className="neumorphic-dark rounded-2xl p-5">
        <p className="text-sm text-slate-300">Promokodni kiriting va tekshirib ko‘ring.</p>

        <div className="mt-4 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="PROMO123"
            className="flex-1 rounded-xl bg-backgroundDark/60 border border-slate-700 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primaryHome"
          />
          <button
            type="button"
            className="bg-primaryHome hover:bg-primaryHome/90 text-backgroundDark font-bold px-4 rounded-xl active:scale-95"
            onClick={check}
            disabled={loading}
          >
            {loading ? "…" : "Tekshir"}
          </button>
        </div>

        {err ? <p className="mt-3 text-sm text-red-400">{err}</p> : null}

        {result ? (
          <div className="mt-4 rounded-2xl border border-primaryHome/30 p-4">
            <div className="font-bold text-primaryHome">OK</div>
            <pre className="mt-2 text-xs text-slate-300 whitespace-pre-wrap break-words">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
