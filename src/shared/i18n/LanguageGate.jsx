import React from "react";
import { Button, Typography } from "antd";
import { useLanguage } from "./useLanguage";

const { Title, Text } = Typography;

// 4 ta til (sizning talabingiz bo'yicha)
const LANGS = [
  { key: "qk", label: "Qaraqalpaqsha", flag: "🇺🇿" },
  { key: "uz", label: "O‘zbekcha", flag: "🇺🇿" },
  { key: "ru", label: "Русский", flag: "🇷🇺" },
  { key: "en", label: "English", flag: "🇬🇧" },
];

/**
 * Kirishda til tanlanmagan bo'lsa — butun ekranni to'sib turadigan "parda".
 * Tanlangandan keyin localStorage('unigo_lang') yoziladi va parda yo'qoladi.
 */
export default function LanguageGate() {
  const { setLangKey, t } = useLanguage();

  let hasChosen = false;
  try {
    hasChosen = !!window.localStorage.getItem("unigo_lang");
  } catch {
    hasChosen = true;
  }

  if (hasChosen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 99999,
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(420px, 92vw)",
          background: "white",
          borderRadius: 16,
          padding: 18,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <Title level={4} style={{ marginBottom: 4 }}>
          {t?.chooseLang || "Tilni tanlang"}
        </Title>
        <Text type="secondary">
          {t?.appSubtitle || ""}
        </Text>

        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          {LANGS.map((l) => (
            <Button
              key={l.key}
              size="large"
              onClick={() => setLangKey(l.key)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                borderRadius: 12,
                height: 48,
              }}
            >
              <span aria-hidden>{l.flag}</span>
              <span>{l.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
