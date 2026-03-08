import React from "react";
import { Card, Steps } from "antd";
import { useClientText } from "../../shared/i18n_clientLocalize";

export default function StatusTimeline({ status }) {
  const { cp } = useClientText();
  const items = [
    { key: "searching", title: cp("Qidirilmoqda") },
    { key: "pickup", title: cp("Oldi") },
    { key: "delivering", title: cp("Yo‘lda") },
    { key: "completed", title: cp("Topshirdi") },
  ];
  const idx = Math.max(0, items.findIndex((x) => x.key === status));
  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 1000, marginBottom: 10 }}>{cp("Holat")}</div>
      <Steps
        size="small"
        current={idx}
        items={items.map((x) => ({ title: x.title }))}
      />
    </Card>
  );
}
