import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@shared/i18n/useLanguage";
import { useThemeMode } from "@/theme/useThemeMode";
import { Button, Select, Divider } from "antd";

const LANG_OPTIONS = [
  { value: "qq_kirill", label: "Qaraqalpaq (Кирилл)" },
  { value: "qq_lotin", label: "Qaraqalpaq (Latin)" },
  { value: "uz_kirill", label: "O‘zbek (Кирилл)" },
  { value: "uz_lotin", label: "O‘zbek (Latin)" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

export default function UniSidebar({ onClose }) {
  const nav = useNavigate();
  const { langKey, setLangKey, t } = useLanguage();
  const { mode, setMode } = useThemeMode();

  const go = (path) => {
    onClose?.();
    nav(path);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>UniGo</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>{t?.appSubtitle || "Super App"}</div>

      <Divider style={{ margin: "10px 0" }} />
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t?.language || "Til"}</div>
      <Select
        value={langKey}
        onChange={(v) => setLangKey(v)}
        options={LANG_OPTIONS}
        style={{ width: "100%", marginBottom: 12 }}
      />

      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t?.theme || "Rejim"}</div>
      <Select
        value={mode}
        onChange={(v) => setMode(v)}
        options={[
          { value: "auto", label: t?.themeAuto || "Avto" },
          { value: "on", label: t?.themeNight || "Tun" },
          { value: "off", label: t?.themeDay || "Kun" },
        ]}
        style={{ width: "100%", marginBottom: 12 }}
      />

      <Divider style={{ margin: "10px 0" }} />

      <div style={{ display: "grid", gap: 8 }}>
        <Button onClick={() => go("/history")}>{t?.history || "Tarix"}</Button>
        <Button onClick={() => go("/settings")}>{t?.settings || "Sozlamalar"}</Button>
        <Button onClick={() => go("/support")}>{t?.support || "Admin bilan aloqa"}</Button>
        <Button danger onClick={() => go("/logout")}>{t?.logout || "Chiqish"}</Button>
      </div>
    </div>
  );
}
