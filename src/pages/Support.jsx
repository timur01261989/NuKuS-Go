import React from "react";
import { Card, Typography } from "antd";

const { Title, Text } = Typography;

export default function Support() {
  return (
    <div style={{ padding: 14, maxWidth: 680, margin: "0 auto" }}>
      <Title level={3} style={{ marginTop: 6 }}>Qo‘llab-quvvatlash</Title>
      <Card style={{ borderRadius: 16 }}>
        <Text type="secondary">
          Bu yerda telefon/telegram/email va FAQ bo‘ladi. Hozircha admin kontaktlarini qo‘shib qo‘ying.
        </Text>
      </Card>
    </div>
  );
}
