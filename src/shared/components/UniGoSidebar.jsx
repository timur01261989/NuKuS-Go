import React, { useMemo } from "react";
import { Drawer } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@shared/i18n/useLanguage";
import { useThemeMode } from "@/theme/useThemeMode";

function SidebarItem({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition text-left"
    >
      <span className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
        {icon}
      </span>
      <span className="flex-1 font-medium text-gray-800">{label}</span>
      <span className="text-gray-400">›</span>
    </button>
  );
}

export default function UniGoSidebar({ open, onClose }) {
  const nav = useNavigate();
  const loc = useLocation();
  const { langKey, setLangKey, t } = useLanguage();
  const { nightMode, setNightMode } = useThemeMode();

  const languages = useMemo(
    () => [
      { key: "qq_kirill", label: "Қарақалпақ (Кирилл)" },
      { key: "qq_lotin", label: "Qaraqalpaq (Lotin)" },
      { key: "uz_kirill", label: "Ўзбек (Кирилл)" },
      { key: "uz_lotin", label: "O'zbek (Lotin)" },
      { key: "ru", label: "Русский" },
      { key: "en", label: "English" },
    ],
    []
  );

  const go = (to) => {
    try {
      // history stack: navigate back should work naturally
      nav(to);
      onClose?.();
    } catch {}
  };

  return (
    <Drawer
      placement="left"
      open={open}
      onClose={onClose}
      width={320}
      styles={{ body: { padding: 16 } }}
      closable={false}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl">
          UG
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold text-gray-900">UniGo</div>
          <div className="text-xs text-gray-500">{t?.superApp || "Yagona yechim"}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition"
        >
          ✕
        </button>
      </div>

      {/* Language */}
      <div className="mb-5">
        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">
          {t?.language || "Til"}
        </div>
        <select
          value={langKey}
          onChange={(e) => setLangKey(e.target.value)}
          className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {languages.map((l) => (
            <option key={l.key} value={l.key}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* Theme */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">
          {t?.theme || "Rejim"}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "auto", label: t?.auto || "Auto" },
            { key: "on", label: t?.night || "Tun" },
            { key: "off", label: t?.day || "Kun" },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setNightMode(m.key)}
              className={[
                "px-3 py-2 rounded-xl border text-sm font-semibold transition",
                nightMode === m.key
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
              ].join(" ")}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <SidebarItem icon="🕘" label={t?.history || "Tarix"} onClick={() => go("/client/orders")} />
        <SidebarItem icon="👤" label={t?.profile || "Profil"} onClick={() => go("/settings")} />
        <SidebarItem icon="🛟" label={t?.support || "Admin bilan aloqa"} onClick={() => go("/support")} />
        <SidebarItem icon="🚪" label={t?.logout || "Chiqish"} onClick={() => go("/logout")} />
      </div>

      <div className="mt-6 text-xs text-gray-400">
        {t?.routeHint || "Orqaga tugmasi ishlaydi: tarix bo‘yicha qaytadi."}
      </div>
    </Drawer>
  );
}
