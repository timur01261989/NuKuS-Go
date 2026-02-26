import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { message } from "antd";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@shared/i18n/useLanguage";

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [fullPhone, setFullPhone] = useState("");

  // WebOTP auto-read (best effort)
  useEffect(() => {
    if (!("OTPCredential" in window)) return;
    if (step !== 2) return;

    const ac = new AbortController();
    navigator.credentials
      .get({
        otp: { transport: ["sms"] },
        signal: ac.signal,
      })
      .then((cred) => {
        if (!cred?.code) return;
        setOtp(cred.code);
        // auto verify
        onVerifyOtp(cred.code);
      })
      .catch(() => {});
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const formatUzPhone = (rawPhone) => {
    let digits = String(rawPhone || "").replace(/\D/g, "");
    if (digits.length === 9) digits = "998" + digits;
    if (!digits.startsWith("998")) digits = "998" + digits;
    digits = digits.slice(0, 12);
    return "+" + digits;
  };

  const onSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const p = formatUzPhone(phone);
      const { error } = await supabase.auth.signInWithOtp({ phone: p });
      if (error) throw error;

      setFullPhone(p);
      setStep(2);
      message.success(t("otp_sent") || "SMS kod yuborildi!");
    } catch (err) {
      message.error((err && err.message) || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (codeOverride) => {
    const code = String(codeOverride ?? otp ?? "").trim();
    if (!code) return message.warning("Kod kiriting");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: code,
        type: "sms",
      });
      if (error) throw error;

      // Update profile metadata (keeps your existing flow: profiles table may exist or not)
      try {
        await supabase.auth.updateUser({
          data: { full_name: fullName || "" },
        });
      } catch {}

      message.success(t("register_success") || "Ro'yxatdan o'tish yakunlandi!");
      navigate("/", { replace: true });
      return data;
    } catch (err) {
      message.error((err && err.message) || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-orange-50 to-amber-50 p-4">
      <main className="w-full max-w-sm">
        <header className="mb-6">
          <button
            type="button"
            onClick={() => (step === 1 ? navigate("/auth") : setStep(1))}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← {t("back") || "Orqaga"}
          </button>
        </header>

        <section className="rounded-3xl p-8 shadow-xl bg-white/95 backdrop-blur border border-white/30">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {step === 1 ? (t("register_title") || "Ro'yxatdan o'tish") : (t("otp_title") || "SMS tasdiqlash")}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {step === 1
                ? (t("register_sub") || "Telefon raqamingizni kiriting")
                : (t("otp_sub") || "SMS orqali kelgan kodni kiriting")}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={onSendOtp} className="space-y-5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">
                  {t("full_name") || "Ism familiya"}
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-gray-700"
                  placeholder="Abdiev Timur"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">
                  {t("phone") || "Telefon raqam"}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-400 font-medium">+998</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-16 pr-4 py-3.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-gray-700"
                    placeholder="90 123 45 67"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-lg disabled:opacity-60"
                type="submit"
              >
                {loading ? (t("loading") || "Kutilmoqda...") : (t("send_sms") || "SMS yuborish")}
              </button>

              <p className="text-center text-gray-600 text-sm">
                {t("have_account") || "Akkauntingiz bormi?"}{" "}
                <Link to="/auth" className="text-blue-600 font-semibold hover:underline">
                  {t("login") || "Kirish"}
                </Link>
              </p>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                <div className="font-semibold">{t("sent_to") || "Yuborildi:"}</div>
                <div className="mt-1">{fullPhone}</div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">
                  {t("sms_code") || "SMS kodi"}
                </label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-gray-700 tracking-widest text-center text-lg"
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                />
              </div>

              <button
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg disabled:opacity-60"
                type="button"
                onClick={() => onVerifyOtp()}
              >
                {loading ? (t("loading") || "Kutilmoqda...") : (t("confirm") || "Tasdiqlash")}
              </button>

              <button
                type="button"
                className="w-full py-3.5 rounded-xl bg-white border border-gray-200 text-gray-800 font-semibold hover:bg-gray-50"
                onClick={() => onSendOtp({ preventDefault: () => {} })}
              >
                {t("resend") || "Qayta yuborish"}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
