import React from "react";
import { Switch, Typography } from "antd";
import { InboxOutlined } from "@ant-design/icons";

export default function DeliveryModeToggle({ enabled, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 12,
          background: enabled ? "rgba(24,144,255,.12)" : "rgba(0,0,0,.06)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <InboxOutlined style={{ fontSize: 18, color: enabled ? "#1890ff" : "#666" }} />
        </div>
        <div>
          <Typography.Text strong>Pochta olaman</Typography.Text>
          <div style={{ fontSize: 12, color: "#888" }}>Yo'lingizdagi posilkalarni ko'rsatadi</div>
        </div>
      </div>
      <Switch checked={!!enabled} onChange={(v) => onChange?.(v)} />
    </div>
  );
}
