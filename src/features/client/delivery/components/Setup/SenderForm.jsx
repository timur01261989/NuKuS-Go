import React from "react";
import { useClientText } from "../../shared/i18n_clientLocalize";
import { Card, Form, Input, Typography } from "antd";
const { Text } = Typography;

export default function SenderForm({ value, onChange }) {
  const v = value || {};
  const set = (patch) => onChange?.({ ...v, ...patch });

  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 1000, marginBottom: 10 }}>Yuboruvchi</div>
      <Form layout="vertical">
        <Form.Item label={cp("Telefon raqam")} required>
          <Input value={v.phone || ""} onChange={(e) => set({ phone: e.target.value })} placeholder="+998..." />
        </Form.Item>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Form.Item label="Podyezd">
            <Input value={v.entrance || ""} onChange={(e) => set({ entrance: e.target.value })} placeholder="1" />
          </Form.Item>
          <Form.Item label="Qavat">
            <Input value={v.floor || ""} onChange={(e) => set({ floor: e.target.value })} placeholder="3" />
          </Form.Item>
          <Form.Item label="Kvartira">
            <Input value={v.apartment || ""} onChange={(e) => set({ apartment: e.target.value })} placeholder="12" />
          </Form.Item>
        </div>

        <Text type="secondary" style={{ fontSize: 12 }}>
          Podyezd/qavat/kvartira — kuryer adashmasligi uchun.
        </Text>
      </Form>
    </Card>
  );
}