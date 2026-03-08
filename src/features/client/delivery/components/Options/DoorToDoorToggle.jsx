import React from "react";
import { Card, Switch, Typography } from "antd";
import { useClientText } from "../../shared/i18n_clientLocalize";
const { Text } = Typography;

export default function DoorToDoorToggle({ value, onChange }) {
  const { cp } = useClientText();
  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 1000 }}>{cp("Eshikkacha (Door to Door)")}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{cp("+5,000 so‘m — kuryer kvartira eshigigacha chiqadi")}</Text>
        </div>
        <Switch checked={!!value} onChange={(v) => onChange?.(v)} />
      </div>
    </Card>
  );
}
