import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // step 1: user info, step 2: otp verify
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState(false);

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState(null); // { fullPhone, name, surname, password }

  // --- 1. AVTOMATIK SMS O‘QISH (WebOTP API) ---
  useEffect(() => {
    if (!("OTPCredential" in window)) return;
    if (step !== 2) return;
    if (!formData?.fullPhone) return;

    const ac = new AbortController();
    navigator.credentials
      .get({
        otp: { transport: ["sms"] },
        signal: ac.signal,
      })
      .then((cred) => {
        if (!cred?.code) return;
        setOtp(String(cred.code).slice(0, 6));
        onVerifyOtp(String(cred.code).slice(0, 6));
      })
      .catch(() => {});
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, formData?.fullPhone]);

  const normalizePhoneInput = (value) => {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
    let out = digits;
    if (digits.length > 2) out = `${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length > 5) out = `${out.slice(0, 6)} ${digits.slice(5)}`;
    if (digits.length > 7) out = `${out.slice(0, 9)} ${digits.slice(7)}`;
    return out;
  };

  const toFullPhone = (local9digits) => {
    let digits = String(local9digits || "").replace(/\D/g, "");
    if (digits.length !== 9) return null;
    if (!digits.startsWith("998")) digits = "998" + digits;
    return "+" + digits;
  };

  const onGetOtp = async (e) => {
    e.preventDefault();
    if (loading) return;

    const d = phone.replace(/\D/g, "");
    if (!name.trim()) return message.error("Ismingizni kiriting.");
    if (!surname.trim()) return message.error("Familiyangizni kiriting.");
    if (d.length !== 9) return message.error("Telefon raqamni to'liq kiriting (9 ta raqam).");
    if (!password || password.length < 6) return message.error("Parol kamida 6 ta belgidan iborat bo'lsin.");

    setLoading(true);
    try {
      const fullPhone = toFullPhone(d);
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) throw error;

      message.success("SMS kod yuborildi!");
      setToast(true);
      setTimeout(() => setToast(false), 2500);

      setFormData({
        name: name.trim(),
        surname: surname.trim(),
        password,
        fullPhone,
      });
      setStep(2);
    } catch (err) {
      message.error("Xatolik: " + (err?.message || "Noma'lum xatolik"));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (otpCode) => {
    const code = String(otpCode || otp).replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) {
      message.error("Kod 6 ta raqam bo'lishi kerak.");
      return;
    }
    if (!formData?.fullPhone) {
      message.error("Telefon raqam topilmadi. Qaytadan urinib ko'ring.");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formData.fullPhone,
        token: code,
        type: "sms",
      });
      if (error) throw error;

      if (data?.user) {
        const registrationTime = new Date().toISOString();

        await supabase.auth.updateUser({ password: formData.password });

        const safeName = formData.name || "Noma'lum";
        const safeSurname = formData.surname || "Foydalanuvchi";

        const { error: profileError } = await supabase.from("profiles").upsert([
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
      message.error("Xatolik: " + (err?.message || "Noma'lum xatolik"));
    } finally {
      setLoading(false);
    }
  };

  const headerIcon = useMemo(
    () => (
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M13.13 2.188c-4.905 4.905-5.12 11.531-1.258 15.393.187.187.457.243.687.147.232-.096.381-.322.381-.572V14h3.13l.412-.412c.118-.118.188-.278.188-.447V10h2.188l.412-.412c.118-.118.188-.278.188-.447V7h1.412c.265 0 .52-.105.707-.293.188-.188.293-.442.293-.707V4.588c0-.53-.43-.96-.96-.96h-1.412c-.265 0-.52.105-.707.293L13.13 2.188z"
          fill="#ec5b13"
        />
        <circle cx="19.5" cy="1.5" r="1.5" fill="#ec5b13" fillOpacity="0.4" />
        <circle cx="22.5" cy="19.5" r="1.5" fill="#ec5b13" fillOpacity="0.2" />
        <path
          d="M21.07 14.232l-4.232-4.232c-.187-.187-.442-.293-.707-.293H14.12l-.412.412c-.118.118-.188.278-.188.447V12h-2.188l-.412.412c-.118.118-.188.278-.188.447v3.13h-3.131c-.25 0-.476.149-.572.381-.096.23-.04.5.147.687 3.862 3.862 10.488 3.647 15.393-1.258l-1.688-1.688c-.187-.187-.293-.442-.293-.707v-1.18z"
          fill="#ec5b13"
        />
      </svg>
    ),
    []
  );

  // --- STEP 1: Register design (neumorphic) ---
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#E3EDF7] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-10">
            <div className="mb-6">{headerIcon}</div>
            <h1 className="text-5xl font-bold text-[#1e293b] tracking-tight">UniGo</h1>
            <p className="text-[#ec5b13] font-medium mt-1 text-base">Yangi hisob yaratish</p>
          </div>

          <div className="rounded-[32px] p-8 nm-flat">
            <div className="flex items-center justify-between mb-8">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-12 h-12 rounded-2xl nm-button flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Back"
              >
                <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-slate-800 tracking-wide">Ro'yxatdan o'tish</h2>
              <div className="w-12 h-12" />
            </div>

            <form className="space-y-5" onSubmit={onGetOtp}>
              <div>
                <label className="text-xs font-semibold text-slate-500 ml-1">Ism</label>
                <div className="mt-2 nm-inset rounded-2xl px-4 py-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                    placeholder="Ismingiz"
                    autoComplete="given-name"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 ml-1">Familiya</label>
                <div className="mt-2 nm-inset rounded-2xl px-4 py-3">
                  <input
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                    placeholder="Familiyangiz"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 ml-1">Telefon raqam</label>
                <div className="mt-2 nm-inset rounded-2xl px-4 py-3 flex items-center">
                  <span className="text-slate-600 font-semibold mr-2">+998</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
                    className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                    placeholder="90 123 45 67"
                    inputMode="numeric"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 ml-1">Parol</label>
                <div className="mt-2 nm-inset rounded-2xl px-4 py-3">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                    placeholder="Kamida 6 ta belgi"
                    type="password"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl py-4 font-extrabold tracking-wider text-slate-800 nm-button active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Yuborilmoqda..." : "SMS KOD OLISH"}
              </button>
            </form>

            <p className="text-center text-slate-500 text-sm mt-8">
              Allaqachon hisobingiz bormi?
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-[#ec5b13] font-bold hover:underline ml-1"
              >
                Kirish
              </button>
            </p>
          </div>
        </div>

        <style>{`
          .nm-flat {
            background: #E3EDF7;
            box-shadow: 18px 18px 30px #D1D9E6, -18px -18px 30px #FFFFFF;
          }
          .nm-inset {
            background: #E3EDF7;
            box-shadow: inset 6px 6px 12px #D1D9E6, inset -6px -6px 12px #FFFFFF;
          }
          .nm-button {
            background: #E3EDF7;
            box-shadow: 8px 8px 16px #D1D9E6, -8px -8px 16px #FFFFFF;
          }
          input[type=number]::-webkit-inner-spin-button,
          input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  // --- STEP 2: SMS verify design ---
  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center px-4 py-8">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-white rounded-full shadow-lg px-6 py-3 flex items-center space-x-3 border border-gray-100">
            <svg className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">SMS kod yuborildi!</span>
          </div>
        </div>
      )}

      <main className="w-full max-w-md px-4 py-8">
        <div className="bg-black/90 border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gray-800/20 to-transparent pointer-events-none" />
          <div className="relative z-10 flex items-center mb-8">
            <button
              type="button"
              onClick={() => {
                setOtp("");
                setStep(1);
              }}
              className="text-gray-400 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
              aria-label="Back"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <h1 className="text-white text-lg font-bold tracking-wider uppercase ml-2 flex-grow text-center pr-8">
              Ro'yxatdan O'tish
            </h1>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="bg-[#FFFBEB] text-yellow-900 rounded-xl p-4 border border-yellow-200/50">
              <p className="text-sm font-semibold">Kod yuborildi:</p>
              <p className="text-lg font-black tracking-wide">{formData?.fullPhone}</p>
              <p className="text-xs mt-1 opacity-70">Iltimos, SMS orqali kelgan 6 xonali kodni kiriting.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                SMS KOD
              </label>
              <input
                value={otp}
                onChange={(e) => setOtp(String(e.target.value).replace(/\D/g, "").slice(0, 6))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-5 text-center text-3xl tracking-[0.6em] font-black text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 no-scrollbar"
                placeholder="······"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => onVerifyOtp()}
              className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Tekshirilmoqda..." : "TASDIQLASH"}
            </button>

            <div className="text-center text-gray-500 text-sm">
              Kod kelmadimi?{" "}
              <button
                type="button"
                onClick={() => {
                  // resend using existing flow, no new step
                  const d = String(formData?.fullPhone || "");
                  if (!d) return;
                  setToast(false);
                  setLoading(true);
                  supabase.auth
                    .signInWithOtp({ phone: formData.fullPhone })
                    .then(({ error }) => {
                      if (error) throw error;
                      message.success("SMS kod qayta yuborildi!");
                      setToast(true);
                      setTimeout(() => setToast(false), 2500);
                    })
                    .catch((err) => message.error("Xatolik: " + (err?.message || "Noma'lum xatolik")))
                    .finally(() => setLoading(false));
                }}
                className="text-white font-semibold hover:underline"
              >
                Qayta yuborish
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
}
