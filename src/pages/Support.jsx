import React from "react";
import { Card, Typography } from "antd";
import { usePageI18n } from "./pageI18n";

const { Title, Text } = Typography;

export default function Support() {
  const { t, tx } = usePageI18n();
  return (
    <div style={{ padding: 14, maxWidth: 680, margin: "0 auto" }}>
      <Title level={3} style={{ marginTop: 6 }}>{t.supportTitle || tx("supportSection", "Yordam")}</Title>
      <Card style={{ borderRadius: 16 }}><Text type="secondary">{t.supportHint || tx("supportHintLocal", "Qo'llab-quvvatlash bo'limi.")}</Text></Card>
    </div>
  );
}
