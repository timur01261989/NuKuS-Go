import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { message } from "antd";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { useLanguage } from "@shared/i18n/useLanguage";
import { supabase } from "@/lib/supabase";

export default function Auth() {
  const navigate = useNavigate();
  const { langKey, setLangKey, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

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
    (async () => {
      try {
        if (!supabase?.auth) return;
        const { data } = await supabase.auth.getSession();
        if (data?.session) navigate("/", { replace: true });
      } catch {
        // ignore
      }
    })();
  }, [navigate]);

  const formatUzPhone = (rawPhone) => {
    let digits = String(rawPhone || "").replace(/\D/g, "");
    // allow user to type 9 digits without +998
    if (digits.length === 9) digits = "998" + digits;
    if (!digits.startsWith("998")) digits = "998" + digits;
    digits = digits.slice(0, 12);
    return "+" + digits;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fullPhone = formatUzPhone(phone);

      const { error } = await supabase.auth.signInWithPassword({
        phone: fullPhone,
        password,
      });
      if (error) throw error;

      // Keep legacy redirect behavior (RootRedirect decides role + mode)
      message.success(t("login_success") || "Muvaffaqiyatli!");
      navigate("/", { replace: true });
    } catch (err) {
      message.error((err && err.message) || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-4">
      <main className="w-full max-w-sm">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-2xl shadow-lg mb-4 transform rotate-3">
            <span className="text-white text-3xl font-black tracking-tighter">UG</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">UniGo</h1>
          <p className="text-blue-600 font-medium tracking-wide uppercase text-sm mt-1">
            Yagona Yechim
          </p>
        </header>

        <section className="rounded-3xl p-8 shadow-xl bg-white/90 backdrop-blur border border-white/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">{t("login_title") || "Tizimga kirish"}</h2>

            <select
              value={langKey}
              onChange={(e) => {
                setLangKey(e.target.value);
                message.success("Til o'zgartirildi");
              }}
              className="text-sm bg-transparent border border-gray-200 rounded-lg px-2 py-1 text-gray-700"
            >
              {languages.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">
                {t("phone") || "Telefon raqam"}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-400 font-medium">+998</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-16 pr-4 py-3.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-700"
                  placeholder="90 123 45 67"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">
                {t("password") || "Parol"}
              </label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-700"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                  aria-label="toggle password"
                >
                  {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-gray-300"
                />
                {t("remember_me") || "Eslab qolish"}
              </label>
              <Link to="/reset-password" className="text-blue-600 hover:underline">
                {t("forgot_password") || "Parol unutdingizmi?"}
              </Link>
            </div>

            <button
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg disabled:opacity-60"
              type="submit"
            >
              {loading ? (t("loading") || "Kutilmoqda...") : (t("login") || "Kirish")}
            </button>

            <p className="text-center text-gray-600 text-sm">
              {t("no_account") || "Akkauntingiz yo'qmi?"}{" "}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                {t("register") || "Ro'yxatdan o'tish"}
              </Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
