import React from "react";
import { Card, Switch, Button, InputNumber } from "antd";

export default function MoverOption({ movers, onChange }) {
  const enabled = !!movers?.enabled;
  const count = Number(movers?.count || 0);
  const per = Number(movers?.pricePerMover || 50000);

  return (
    <Card size="small" style={{ borderRadius: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800 }}>Gruzchik</div>
          <div style={{ fontSize: 12, color: "#666" }}>Har bir yuklovchi uchun +{per.toLocaleString("ru-RU")} so‘m</div>
        </div>
        <Switch checked={enabled} onChange={(v) => onChange?.({ enabled: v, count: v ? Math.max(1, count) : 0 })} />
      </div>

      {enabled ? (
        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
          <Button onClick={() => onChange?.({ count: Math.max(0, count - 1) })}>-</Button>
          <InputNumber min={0} value={count} onChange={(v) => onChange?.({ count: Number(v || 0) })} />
          <Button onClick={() => onChange?.({ count: count + 1 })}>+</Button>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#666" }}>
            Qo‘shimcha: {(count * per).toLocaleString("ru-RU")} so‘m
          </div>
        </div>
      ) : null}
    </Card>
  );
}
