import React, { useMemo } from "react";
import { Card, Divider, Select, Switch, Typography, message } from "antd";
import { useLanguage } from "@shared/i18n/useLanguage";

const { Title, Text } = Typography;

export default function Settings() {
  const { langKey, setLangKey, t } = useLanguage();

  const languageOptions = useMemo(() => ([
    { value: "uz_lotin", label: "O'zbek (Lotin)" },
    { value: "uz_kirill", label: "Ўзбек (Кирилл)" },
    { value: "qq_lotin", label: "Qaraqalpaq (Lotin)" },
    { value: "qq_kirill", label: "Қарақалпақ (Кирилл)" },
    { value: "ru", label: "Русский" },
    { value: "en", label: "English" },
  ]), []);

  const onLang = (v) => {
    setLangKey(v);
    message.success(t?.languageChanged || "Til o'zgartirildi");
  };

  // placeholder toggles; wire them later
  return (
    <div style={{ padding: 14, maxWidth: 680, margin: "0 auto" }}>
      <Title level={3} style={{ marginTop: 6 }}>{t?.settings || "Sozlamalar"}</Title>

      <Card style={{ borderRadius: 16 }}>
        <Text strong>{t?.language || "Til"}</Text>
        <div style={{ marginTop: 8 }}>
          <Select value={langKey} options={languageOptions} style={{ width: "100%" }} onChange={onLang} />
        </div>

        <Divider />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <Text strong>{t?.nightMode || "Tungi rejim"}</Text><br/>
            <Text type="secondary">{t?.nightModeHint || "Avto/On/Off keyin ulanadi"}</Text>
          </div>
          <Switch disabled />
        </div>

        <Divider />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <Text strong>{t?.notifications || "Bildirishnomalar"}</Text><br/>
            <Text type="secondary">{t?.notificationsHint || "Keyin sozlanadi"}</Text>
          </div>
          <Switch disabled />
        </div>
      </Card>
    </div>
  );
}
