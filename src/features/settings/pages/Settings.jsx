import React, { useEffect, useMemo, useState } from "react";
import { Card, Divider, Select, Switch, Typography, message, Segmented } from "antd";
import { useLanguage } from "@shared/i18n/useLanguage";

const { Title, Text } = Typography;

function safeNightModeValue(v) {
  return v === "on" || v === "off" || v === "auto" ? v : "auto";
}

function safeBoolFromLS(v, fallback = true) {
  if (v === "1") return true;
  if (v === "0") return false;
  return fallback;
}

export default function Settings() {
  const { langKey, setLangKey, t } = useLanguage();

  // Night mode: "auto" | "on" | "off"
  const [nightMode, setNightMode] = useState("auto");

  // Notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Language options
  const languageOptions = useMemo(
    () => [
      { value: "uz_lotin", label: "O'zbek (Lotin)" },
      { value: "uz_kirill", label: "Ўзбек (Кирилл)" },
      { value: "qq_lotin", label: "Qaraqalpaq (Lotin)" },
      { value: "qq_kirill", label: "Қарақалпақ (Кирилл)" },
      { value: "ru", label: "Русский" },
      { value: "en", label: "English" },
    ],
    []
  );

  // init from localStorage
  useEffect(() => {
    const savedNight = safeNightModeValue(localStorage.getItem("nightMode"));
    setNightMode(savedNight);

    const savedNotif = safeBoolFromLS(localStorage.getItem("notificationsEnabled"), true);
    setNotificationsEnabled(savedNotif);
  }, []);

  // Handlers
  const onLang = (v) => {
    setLangKey(v);
    message.success(t?.languageChanged || "Til o'zgartirildi");
  };

  const onNightMode = (v) => {
    const next = safeNightModeValue(v);
    setNightMode(next);
    localStorage.setItem("nightMode", next);

    // App.jsx darhol bilishi uchun:
    window.dispatchEvent(new Event("nightModeChanged"));

    if (next === "auto") message.success(t?.nightModeAuto || "Tungi rejim: Avto");
    if (next === "on") message.success(t?.nightModeOn || "Tungi rejim: Yoqildi");
    if (next === "off") message.success(t?.nightModeOff || "Tungi rejim: O‘chirildi");
  };

  const onNotifications = (checked) => {
    setNotificationsEnabled(checked);
    localStorage.setItem("notificationsEnabled", checked ? "1" : "0");

    message.success(
      checked
        ? (t?.notificationsOn || "Bildirishnomalar yoqildi")
        : (t?.notificationsOff || "Bildirishnomalar o‘chirildi")
    );
  };

  return (
    <div style={{ padding: 14, maxWidth: 680, margin: "0 auto" }}>
      <Title level={3} style={{ marginTop: 6 }}>
        {t?.settings || "Sozlamalar"}
      </Title>

      <Card style={{ borderRadius: 16 }}>
        {/* LANGUAGE */}
        <Text strong>{t?.language || "Til"}</Text>
        <div style={{ marginTop: 8 }}>
          <Select
            value={langKey}
            options={languageOptions}
            style={{ width: "100%" }}
            onChange={onLang}
          />
        </div>

        <Divider />

        {/* NIGHT MODE */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 220 }}>
            <Text strong>{t?.nightMode || "Tungi rejim"}</Text>
            <br />
            <Text type="secondary">
              {t?.nightModeHint || "Auto / On / Off"}
              <br />
              <span style={{ opacity: 0.85 }}>
                {t?.current || "Hozir"}: <b>{nightMode}</b>
              </span>
            </Text>
          </div>

          <Segmented
            value={nightMode}
            onChange={onNightMode}
            options={[
              { label: t?.auto || "Auto", value: "auto" },
              { label: t?.on || "On", value: "on" },
              { label: t?.off || "Off", value: "off" },
            ]}
          />
        </div>

        <Divider />

        {/* NOTIFICATIONS */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <Text strong>{t?.notifications || "Bildirishnomalar"}</Text>
            <br />
            <Text type="secondary">
              {t?.notificationsHint || "Hozircha UI holati saqlanadi (keyin backend push ulanadi)"}
            </Text>
          </div>

          <Switch checked={notificationsEnabled} onChange={onNotifications} />
        </div>
      </Card>
    </div>
  );
}
