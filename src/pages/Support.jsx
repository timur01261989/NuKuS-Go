import React from "react";
import { Card, Typography } from "antd";
import { useLanguage } from "@/shared/i18n/useLanguage";

const { Title, Text } = Typography;

export default function Support() {
  const { t } = useLanguage();
  return (
    <div style={{ padding: 14, maxWidth: 680, margin: "0 auto" }}>
      <Title level={3} style={{ marginTop: 6 }}>{t.supportTitle}</Title>
      <Card style={{ borderRadius: 16 }}><Text type="secondary">{t.supportHint}</Text></Card>
    </div>
  );
}
