import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@shared/i18n/useLanguage";

export default function Auth() {
  const navigate = useNavigate();
  const { langKey, setLangKey, t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

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
    // UI placeholder: user may type 90xxxxxxx or +998...
    if (digits.length === 9) digits = "998" + digits;
    if (!digits.startsWith("998")) digits = "998" + digits;
    digits = digits.slice(0, 12);
    return "+" + digits;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const phoneRaw = form.get("phone");
    const password = String(form.get("password") || "");

    if (!phoneRaw || !password) {
      message.error(t?.fillAll || "Hamma maydonlarni to‘ldiring");
      return;
    }

    setLoading(true);
    try {
      const phone = formatUzPhone(phoneRaw);
      const { error } = await supabase.auth.signInWithPassword({ phone, password });
      if (error) throw error;

      message.success(t?.greeting || "Xush kelibsiz!");
      try { localStorage.setItem("app_mode", "client"); } catch {}
      navigate("/", { replace: true });
    } catch {
      message.error(t?.loginFail || "Telefon raqam yoki parol noto‘g‘ri!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-sky-100 to-indigo-100">
      <div className="w-full max-w-sm">
        {/* top right language */}
        <div className="flex justify-end mb-4">
          <select
            value={langKey}
            onChange={(e) => setLangKey(e.target.value)}
            className="rounded-xl bg-white/80 border border-white/40 backdrop-blur px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {languages.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <header className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-2xl shadow-lg mb-3 rotate-3">
            <span className="text-white text-3xl font-black tracking-tighter">UG</span>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">UniGo</h1>
          <p className="text-amber-700 font-semibold tracking-wide uppercase text-xs mt-1">
            {t?.superApp || "Yagona yechim"}
          </p>
        </header>

        {/* Card */}
        <section className="rounded-3xl p-7 bg-white/90 backdrop-blur border border-white/40 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-5 text-center">
            {t?.login || "Tizimga kirish"}
          </h2>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">
                {t?.phone || "Telefon raqam"}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-400 font-semibold">+998</span>
                <input
                  name="phone"
                  type="tel"
                  placeholder="90 123 45 67"
                  className="w-full pl-16 pr-4 py-3.5 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">
                {t?.password || "Parol"}
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl hover:bg-gray-100 active:bg-gray-200 text-gray-500"
                  aria-label="Show password"
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <button
                type="button"
                onClick={() => navigate("/reset-password")}
                className="font-semibold text-amber-600 hover:text-amber-700"
              >
                {t?.forgot || "Parolni unutdingizmi?"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 transition text-white font-extrabold shadow-lg disabled:opacity-60"
            >
              {loading ? (t?.loading || "Kuting...") : (t?.loginBtn || "Kirish")}
            </button>

            <div className="text-center text-sm text-gray-500">
              {t?.noAccount || "Akkaunt yo‘qmi?"}{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="font-extrabold text-amber-600 hover:text-amber-700"
              >
                {t?.register || "Ro‘yxatdan o‘tish"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
