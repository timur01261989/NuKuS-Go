import React, { useState } from "react";
import { Card, Input, Button, Space, message } from "antd";
import { SwapOutlined } from "@ant-design/icons";
import UnifiedOrdersFeed from "../../shared/UnifiedOrdersFeed";

export default function RouteBidBoard({ route, onRouteChange, orders, onBid }) {
  const [from, setFrom] = useState(route?.from || "");
  const [to, setTo] = useState(route?.to || "");

  const apply = () => {
    if (!from || !to) {
      message.warning("Qayerdan va qayerga to‘ldiring");
      return;
    }
    onRouteChange?.({ from, to });
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Card size="small" style={{ borderRadius: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Yo‘nalish (Uzoq yo‘l)</div>
        <Space.Compact style={{ width: "100%" }}>
          <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Qayerdan (viloyat/shahar)" />
          <Button icon={<SwapOutlined />} onClick={() => { setFrom(to); setTo(from); }} />
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Qayerga" />
        </Space.Compact>
        <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
          <Button type="primary" onClick={apply}>Qo‘llash</Button>
        </div>
      </Card>

      <UnifiedOrdersFeed orders={orders} onBid={onBid} />
    </div>
  );
}
