import React from "react";
import { Card, Steps } from "antd";

export default function StatusTimeline({ status }) {
  const items = [
    { key: "searching", title: "Qidirilmoqda" },
    { key: "pickup", title: "Oldi" },
    { key: "delivering", title: "Yo‘lda" },
    { key: "completed", title: "Topshirdi" },
  ];
  const idx = Math.max(0, items.findIndex((x) => x.key === status));
  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 1000, marginBottom: 10 }}>Holat</div>
      <Steps
        size="small"
        current={idx}
        items={items.map((x) => ({ title: x.title }))}
      />
    </Card>
  );
}
