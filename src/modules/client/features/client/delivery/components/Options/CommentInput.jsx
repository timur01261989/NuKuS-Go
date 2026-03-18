import React from "react";
import { useClientText } from "../../shared/i18n_clientLocalize";
import { Card, Input, Typography } from "antd";
const { Text } = Typography;

export default function CommentInput({ value, onChange }) {
  const { cp } = useClientText();
  return (
    <Card style={{ borderRadius: 18 }} styles={{ body: { padding: 14 } }}>
      <div style={{ fontWeight: 1000, marginBottom: 8 }}>{cp("Kuryerga izoh")}</div>
      <Input.TextArea
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        rows={3}
        placeholder={cp("Masalan: 'Dom orqasidan kiring', 'qo‘ng‘iroq qiling'...")}
      />
      <Text type="secondary" style={{ fontSize: 12 }}>
        {cp("Izoh kuryerga yo‘l topishda yordam beradi.")}
      </Text>
    </Card>
  );
}
