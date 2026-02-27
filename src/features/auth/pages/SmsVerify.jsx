import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { message } from "antd";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@shared/i18n/useLanguage";

export default function SmsVerify() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { t } = useLanguage();

  const phone = useMemo(() => state?.phone || "", [state]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const onConfirm = async (e) => {
    e.preventDefault();
    if (!phone) {
      message.error("Telefon topilmadi. Qaytadan ro'yxatdan o'ting.");
      navigate("/register", { replace: true });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: String(code || "").trim(),
        type: "sms",
      });
      if (error) throw error;
      message.success(t("driverFoundText") || "Tasdiqlandi!");
      navigate("/", { replace: true });
    } catch (err) {
      message.error(err?.message || "SMS confirm error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
        <div className="mb-6">
          <div className="text-2xl font-extrabold tracking-tight">UniGo</div>
          <div className="text-sm text-gray-500">{t("enterSms") || "SMS kod va yangi parolni kiriting"}</div>
          <div className="text-xs text-gray-400 mt-1">{phone}</div>
        </div>

        <form onSubmit={onConfirm} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">{t("smsCode") || "SMS kod"}</label>
            <input
              className="mt-1 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 tracking-widest text-center text-lg"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-3 font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {loading ? "..." : (t("sendCode") || "Kodni yuborish")}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full rounded-xl px-4 py-3 font-semibold border hover:bg-gray-50"
          >
            {t("loginLink") || "Kirish"}
          </button>
        </form>
      </div>
    </div>
  );
}
