import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@shared/i18n/useLanguage";

const LANGS = [
  { key: "qq_kirill", label: "Қарақалпақ (Кirill)" },
  { key: "qq_lotin", label: "Qaraqalpaq (Lotin)" },
  { key: "uz_kirill", label: "Ўзбек (Kiril)" },
  { key: "uz_lotin", label: "O'zbek (Lotin)" },
  { key: "ru", label: "Русский" },
  { key: "en", label: "English" },
];

const THEME_MODES = [
  { key: "auto", label: "Auto" },
  { key: "dark", label: "Tun" },
  { key: "light", label: "Kun" },
];

function applyTheme(mode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  const isDark = mode === "dark" || (mode === "auto" && prefersDark);
  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");
}

export default function UniGoSidebar({ onClose }) {
  const navigate = useNavigate();
  const { langKey, setLangKey, t } = useLanguage();

  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("unigo_theme") || "auto");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    applyTheme(themeMode);
    localStorage.setItem("unigo_theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      const name = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
      setFullName(name);
    })();
  }, []);

  const initials = useMemo(() => {
    const s = String(fullName || "").trim();
    if (!s) return "U";
    return s
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p?.[0]?.toUpperCase())
      .join("") || "U";
  }, [fullName]);

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-11 w-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
          {initials}
        </div>
        <div>
          <div className="font-extrabold leading-tight">UniGo</div>
          <div className="text-xs text-gray-500">{fullName || "User"}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border p-3">
          <div className="text-xs text-gray-500 mb-1">{t("language") || "Til"}</div>
          <select
            className="w-full border rounded-xl px-3 py-2 bg-white"
            value={langKey}
            onChange={(e) => {
              setLangKey(e.target.value);
              message.success("OK");
            }}
          >
            {LANGS.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border p-3">
          <div className="text-xs text-gray-500 mb-1">{t("theme") || "Rejim"}</div>
          <div className="flex gap-2">
            {THEME_MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setThemeMode(m.key)}
                className={
                  "flex-1 rounded-xl px-3 py-2 text-sm font-semibold border " +
                  (themeMode === m.key ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-50")
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden">
          <button
            className="w-full text-left px-4 py-3 hover:bg-gray-50"
            onClick={() => {
              onClose?.();
              navigate("/client/orders");
            }}
          >
            {t("history") || "Tarix"}
          </button>
          <button
            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-t"
            onClick={() => {
              onClose?.();
              navigate("/settings");
            }}
          >
            {t("settings") || "Sozlamalar"}
          </button>
          <button
            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-t"
            onClick={() => {
              onClose?.();
              navigate("/support");
            }}
          >
            {t("support") || "Admin bilan aloqa"}
          </button>
          <button
            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-t text-red-600"
            onClick={async () => {
              await supabase.auth.signOut();
              onClose?.();
              navigate("/login", { replace: true });
            }}
          >
            {t("logout") || "Chiqish"}
          </button>
        </div>

        <div className="text-xs text-gray-400">
          Back tugmasi history bo‘yicha ishlaydi: telefoningizdagi orqaga tugmasi yoki brauzer “Back”.
        </div>
      </div>
    </div>
  );
}
