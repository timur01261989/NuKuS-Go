import React from "react";
import { Card, Input, Typography } from "antd";
const { Text } = Typography;

export default function CommentInput({ value, onChange }) {
  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 1000, marginBottom: 8 }}>Kuryerga izoh</div>
      <Input.TextArea
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        rows={3}
        placeholder="Masalan: 'Dom orqasidan kiring', 'qo‘ng‘iroq qiling'..."
      />
      <Text type="secondary" style={{ fontSize: 12 }}>
        Izoh kuryerga yo‘l topishda yordam beradi.
      </Text>
    </Card>
  );
}
