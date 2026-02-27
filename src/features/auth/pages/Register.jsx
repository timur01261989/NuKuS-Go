import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState(1); // 1=enter info, 2=otp
  const [formData, setFormData] = useState(null);

  const [fields, setFields] = useState({
    name: "",
    surname: "",
    phone: "",
    password: "",
  });
  const [otp, setOtp] = useState("");

  const setField = (k, v) => setFields((p) => ({ ...p, [k]: v }));

  // WebOTP for step 2
  useEffect(() => {
    if (!('OTPCredential' in window) || step !== 2) return;

    const ac = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: ac.signal })
      .then((cred) => {
        if (!cred?.code) return;
        setOtp(cred.code);
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

  const onGetOtp = async (e) => {
    e.preventDefault();
    if (!fields.name || !fields.surname || !fields.phone || !fields.password) {
      message.error("Hamma maydonlarni to‘ldiring");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = formatUzPhone(fields.phone);

      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) throw error;

      message.success("SMS kod yuborildi!");
      setFormData({
        ...fields,
        fullPhone,
      });
      setStep(2);
    } catch (err) {
      message.error("Xatolik: " + (err?.message || "SMS yuborilmadi"));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (code) => {
    if (!formData?.fullPhone) return;

    const token = String(code || otp || "").trim();
    if (token.length < 4) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formData.fullPhone,
        token,
        type: "sms",
      });

      if (error) throw error;

      if (data?.user) {
        const registrationTime = new Date().toISOString();

        // set password after OTP
        await supabase.auth.updateUser({ password: formData.password });

        const safeName = formData.name || "Noma'lum";
        const safeSurname = formData.surname || "Foydalanuvchi";

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert([
            {
              id: data.user.id,
              full_name: `${safeName} ${safeSurname}`,
              phone: formData.fullPhone,
              role: "client",
              created_at: registrationTime,
              last_login: registrationTime,
            },
          ]);

        if (profileError) throw profileError;

        message.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
        navigate("/", { replace: true });
      }
    } catch (err) {
      message.error("Xatolik: " + (err?.message || "Kod noto‘g‘ri"));
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (e) => {
    e.preventDefault();
    await onVerifyOtp(otp);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#E3EDF7]">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => (step === 1 ? navigate("/login") : setStep(1))}
            className="w-11 h-11 rounded-2xl bg-white/70 shadow-sm hover:bg-white active:bg-white transition"
            aria-label="Back"
          >
            ←
          </button>
          <div className="text-lg font-extrabold text-gray-900">
            {step === 1 ? "Ro‘yxatdan o‘tish" : "SMS tasdiqlash"}
          </div>
          <div className="w-11 h-11" />
        </div>

        {step === 1 ? (
          <section className="rounded-3xl bg-[#E3EDF7] shadow-[18px_18px_30px_#D1D9E6,-18px_-18px_30px_#FFFFFF] p-7">
            <div className="text-sm text-gray-600 mb-5">
              Yangi akkaunt yarating va UniGo xizmatlaridan foydalaning.
            </div>

            <form onSubmit={onGetOtp} className="space-y-4">
              <input
                value={fields.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Ism"
                className="w-full px-4 py-3.5 rounded-2xl bg-[#E3EDF7] shadow-[inset_6px_6px_12px_#D1D9E6,inset_-6px_-6px_12px_#FFFFFF] focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <input
                value={fields.surname}
                onChange={(e) => setField("surname", e.target.value)}
                placeholder="Familiya"
                className="w-full px-4 py-3.5 rounded-2xl bg-[#E3EDF7] shadow-[inset_6px_6px_12px_#D1D9E6,inset_-6px_-6px_12px_#FFFFFF] focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">+998</span>
                <input
                  value={fields.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="90 123 45 67"
                  className="w-full pl-16 pr-4 py-3.5 rounded-2xl bg-[#E3EDF7] shadow-[inset_6px_6px_12px_#D1D9E6,inset_-6px_-6px_12px_#FFFFFF] focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <input
                value={fields.password}
                onChange={(e) => setField("password", e.target.value)}
                type="password"
                placeholder="Parol"
                className="w-full px-4 py-3.5 rounded-2xl bg-[#E3EDF7] shadow-[inset_6px_6px_12px_#D1D9E6,inset_-6px_-6px_12px_#FFFFFF] focus:outline-none focus:ring-2 focus:ring-amber-400"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-extrabold bg-[#E3EDF7] shadow-[8px_8px_16px_#D1D9E6,-8px_-8px_16px_#FFFFFF] active:shadow-[inset_4px_4px_8px_#D1D9E6,inset_-4px_-4px_8px_#FFFFFF] disabled:opacity-60"
              >
                {loading ? "Yuborilmoqda..." : "SMS kod olish"}
              </button>

              <div className="text-center text-sm text-gray-600">
                Akkaunt bormi?{" "}
                <button type="button" onClick={() => navigate("/login")} className="font-extrabold text-amber-700">
                  Kirish
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="rounded-3xl bg-white/90 backdrop-blur border border-white/50 shadow-xl p-7">
            <div className="text-sm text-gray-600 mb-4">
              {formData?.fullPhone ? (
                <>
                  Kod <span className="font-bold">{formData.fullPhone}</span> raqamiga yuborildi.
                </>
              ) : (
                "Kod yuborildi."
              )}
            </div>

            <form onSubmit={onOtpSubmit} className="space-y-4">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                placeholder="SMS kod (6 raqam)"
                className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-900 text-center tracking-widest text-lg font-extrabold"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 transition text-white font-extrabold shadow-lg disabled:opacity-60"
              >
                {loading ? "Tekshirilmoqda..." : "Tasdiqlash"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition font-semibold text-gray-700"
              >
                Telefonni o‘zgartirish
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
