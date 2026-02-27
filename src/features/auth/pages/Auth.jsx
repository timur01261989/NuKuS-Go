import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@shared/i18n/useLanguage";

const LANGS = [
  { key: "qq_kirill", label: "Қарақалпақ (Кирилл)" },
  { key: "qq_lotin", label: "Qaraqalpaq (Lotin)" },
  { key: "uz_kirill", label: "Ўзбек (Кирилл)" },
  { key: "uz_lotin", label: "O'zbek (Lotin)" },
  { key: "ru", label: "Русский" },
  { key: "en", label: "English" },
];

function formatUzPhone(rawPhone) {
  let digits = String(rawPhone || "").replace(/\D/g, "");
  // allow entering 9-digit local number (90xxxxxxx) or full
  if (digits.length === 9) digits = "998" + digits;
  if (!digits.startsWith("998")) digits = "998" + digits;
  digits = digits.slice(0, 12);
  return "+" + digits;
}

export default function Auth() {
  const navigate = useNavigate();
  const { langKey, setLangKey, t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const langLabel = useMemo(() => LANGS.find((l) => l.key === langKey)?.label || "Language", [langKey]);

  useEffect(() => {
    const check = async () => {
      if (!supabase?.auth) return;
      const { data } = await supabase.auth.getSession();
      if (data?.session) navigate("/", { replace: true });
    };
    check();
  }, [navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formatted = formatUzPhone(phone);
      const { error } = await supabase.auth.signInWithPassword({ phone: formatted, password });
      if (error) throw error;

      // remember preference
      localStorage.setItem("unigo_remember", remember ? "1" : "0");

      message.success(t("login") || "KIRISH");
      navigate("/", { replace: true });
    } catch (err) {
      message.error(err?.message || "Login error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">UniGo</div>
            <div className="text-sm text-gray-500">{t("appSubtitle") || "Haydovchi va yo'lovchilar uchun"}</div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">{t("language") || "Til"}</div>
            <select
              className="text-sm border rounded-xl px-3 py-2 bg-white"
              value={langKey}
              onChange={(e) => {
                setLangKey(e.target.value);
                message.success("OK");
              }}
              aria-label="language"
            >
              {LANGS.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">{t("enterPhone") || "Telefon raqamingizni kiriting"}</label>
            <input
              className="mt-1 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder={t("phonePlaceholder") || "90 123 45 67"}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">{t("password") || "Parol"}</label>
            <input
              className="mt-1 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              {t("remember") || "Eslab qolish"}
            </label>

            <button
              type="button"
              onClick={() => navigate("/reset-password")}
              className="text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              {t("forgot") || "Parolni unutdingizmi?"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-3 font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {loading ? "..." : (t("login") || "KIRISH")}
          </button>

          <div className="text-sm text-gray-600 text-center">
            {t("noAccount") || "Hisobingiz yo'qmi?"}{" "}
            <button
              type="button"
              className="font-semibold text-gray-900 hover:underline"
              onClick={() => navigate("/register")}
            >
              {t("register") || "Ro'yxatdan o'tish"}
            </button>
          </div>

          <div className="text-xs text-gray-400 text-center">
            {langLabel}
          </div>
        </form>
      </div>
    </div>
  );
}
