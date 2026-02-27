import React from "react";
import { Card, Radio, Typography } from "antd";
const { Text } = Typography;

export default function WhoPaysSwitch({ value = "sender", onChange }) {
  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 1000, marginBottom: 8 }}>Kim to‘laydi?</div>
      <Radio.Group value={value} onChange={(e) => onChange?.(e.target.value)} style={{ display: "flex", gap: 10 }}>
        <Radio.Button value="sender" style={{ borderRadius: 14 }}>Yuboruvchi</Radio.Button>
        <Radio.Button value="receiver" style={{ borderRadius: 14 }}>Oluvchi</Radio.Button>
      </Radio.Group>
      <div style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Agar “Oluvchi to‘laydi” bo‘lsa, kuryer topshirishda pulni oladi (yoki Click).
        </Text>
      </div>
    </Card>
  );
}
