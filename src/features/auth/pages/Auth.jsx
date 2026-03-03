import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { useLanguage } from "@shared/i18n/useLanguage";
import { supabase } from "@/lib/supabase";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { langKey, setLangKey, t } = useLanguage();

  const languages = useMemo(
    () => [
      { key: "uz_lotin", label: "O'zbek (Lotin)" },
      { key: "uz_kirill", label: "Ўзбек (Кирилл)" },
      { key: "qq_lotin", label: "Qaraqalpaq (Lotin)" },
      { key: "qq_kirill", label: "Қарақалпақ (Кирилл)" },
      { key: "ru", label: "Русский" },
      { key: "en", label: "English" },
    ],
    []
  );

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase?.auth) return;
      const { data } = await supabase.auth.getSession();
      if (data?.session) navigate("/", { replace: true });
    };
    checkSession();
  }, [navigate]);

  const formatUzPhone = (rawPhone) => {
    let digits = String(rawPhone || "").replace(/\D/g, "");
    if (digits.length === 9) digits = "998" + digits;
    if (!digits.startsWith("998")) digits = "998" + digits;
    digits = digits.slice(0, 12);
    return "+" + digits;
  };

  const normalizePhoneInput = (value) => {
    // expects user to type only local 9 digits, we keep digits only
    const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
    // format like: 90 123 45 67
    const p = digits;
    let out = p;
    if (p.length > 2) out = `${p.slice(0, 2)} ${p.slice(2)}`;
    if (p.length > 5) out = `${out.slice(0, 6)} ${p.slice(5)}`;
    if (p.length > 7) out = `${out.slice(0, 9)} ${p.slice(7)}`;
    return out;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 9) {
      message.error("Telefon raqamni to'liq kiriting (9 ta raqam).");
      return;
    }
    if (!password) {
      message.error("Parolni kiriting.");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = formatUzPhone(digits);

      const { error } = await supabase.auth.signInWithPassword({
        phone: fullPhone,
        password,
      });
      if (error) throw error;

      // Non-breaking: ensure verified phone is persisted once in profiles and reused everywhere.
      // If profiles table/columns don't exist yet, this silently no-ops.
      try {
        const { data: u } = await supabase.auth.getUser();
        const user = u?.user;
        if (user?.id) {
          const nowIso = new Date().toISOString();
          await supabase.from("profiles").upsert([
            {
              id: user.id,
              phone: user.phone || fullPhone,
              phone_e164: user.phone || fullPhone,
              phone_verified_at: nowIso,
              last_login: nowIso,
            },
          ]);
        }
      } catch (e) {
        // ignore
      }

      message.success(t?.greeting || "Xush kelibsiz!");

      // old behavior: default app_mode="client"
      try {
        localStorage.setItem("app_mode", "client");
        // optional remember flag (non-breaking): store last phone
        if (remember) localStorage.setItem("last_phone", digits);
        else localStorage.removeItem("last_phone");
      } catch (err) {}

      navigate("/", { replace: true });
    } catch (err) {
      message.error("Telefon raqam yoki parol noto'g'ri!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // non-breaking UX: prefill if saved
    try {
      const last = localStorage.getItem("last_phone");
      if (last && !phone) setPhone(normalizePhoneInput(last));
    } catch (err) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentLangLabel = languages.find((l) => l.key === langKey)?.label || "Til";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100 p-4 font-sans">
      <main className="w-full max-w-sm" data-purpose="login-container">
        <header className="text-center mb-8" data-purpose="brand-header">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-unigo-primary rounded-2xl shadow-lg mb-4 transform rotate-3">
            <span className="text-white text-3xl font-black tracking-tighter">UG</span>
          </div>
          <h1 className="text-4xl font-bold text-unigo-dark tracking-tight">UniGo</h1>
          <p className="text-unigo-accent font-medium tracking-wide uppercase text-sm mt-1">
            Yagona Yechim
          </p>
        </header>

        <section
          className="rounded-3xl p-8 shadow-modern bg-white/90 backdrop-blur border border-white/20"
          data-purpose="login-form-card"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Tizimga kirish</h2>

          <form className="space-y-5" onSubmit={onSubmit} autoComplete="on">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase ml-1" htmlFor="phone">
                Telefon raqam
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-400 font-medium">+998</span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="90 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
                  className="w-full pl-16 pr-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all text-gray-700"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase ml-1" htmlFor="password">
                Parol
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-unigo-accent transition-all text-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-unigo-accent"
                  aria-label="Toggle password visibility"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path
                      d="M2.036 12.322a1.012 1.012 0 010-.644C3.399 8.049 7.21 5 12 5c4.79 0 8.601 3.049 9.964 6.678a1.012 1.012 0 010 .644C20.601 15.951 16.79 19 12 19c-4.79 0-8.601-3.049-9.964-6.678z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center cursor-pointer group">
                <input
                  className="rounded border-gray-300 text-unigo-accent focus:ring-unigo-accent w-4 h-4"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="ml-2 text-gray-600 group-hover:text-gray-800">
                  {t?.remember || "Eslab qolish"}
                </span>
              </label>

              <button
                type="button"
                className="text-unigo-accent hover:underline font-medium"
                onClick={() => navigate("/reset-password")}
              >
                Parolni unutdingizmi?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-unigo-primary hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all transform active:scale-[0.98] mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Kutilmoqda..." : "KIRISH"}
            </button>
          </form>
        </section>

        <footer className="mt-8 text-center" data-purpose="footer-links">
          <p className="text-gray-500">
            Hisobingiz yo'qmi?
            <button
              type="button"
              className="text-unigo-accent font-bold hover:underline ml-1"
              onClick={() => navigate("/register")}
            >
              Ro'yxatdan o'tish
            </button>
          </p>

          <div className="mt-6 inline-flex items-center space-x-2 bg-white/50 px-3 py-1 rounded-full border border-white/20">
            <select
              value={langKey}
              onChange={(e) => {
                const key = e.target.value;
                setLangKey(key);
                message.success("Til o'zgartirildi");
              }}
              className="bg-transparent text-xs font-bold text-gray-500 outline-none cursor-pointer"
              aria-label="Language"
            >
              {languages.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* keep label for current selection (non-visual use) */}
          <span className="sr-only">{currentLangLabel}</span>
        </footer>
      </main>
    </div>
  );
}
