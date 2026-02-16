import React from "react";
import { Switch, Typography } from "antd";
import { NodeIndexOutlined } from "@ant-design/icons";

export default function RouteFilter({ onlyMyRoute, onChange, helperText }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 12,
          background: onlyMyRoute ? "rgba(82,196,26,.12)" : "rgba(0,0,0,.06)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <NodeIndexOutlined style={{ fontSize: 18, color: onlyMyRoute ? "#52c41a" : "#666" }} />
        </div>
        <div>
          <Typography.Text strong>Faqat mening yo'limdagilar</Typography.Text>
          <div style={{ fontSize: 12, color: "#888" }}>
            {helperText || "Yo'l-yo'lakay (deviation < 2km) posilkalar"}
          </div>
        </div>
      </div>
      <Switch checked={!!onlyMyRoute} onChange={(v) => onChange?.(v)} />
    </div>
  );
}
