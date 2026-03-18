import React from "react";
import { Typography, Tag } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";

export default function FeedHeader({ title, subtitle, count = 0, tone = "gold", realtimeMeta = null }) {
  const tagColor = tone === "blue" ? "blue" : tone === "green" ? "green" : "gold";
  return (
    <div style={{ padding: "12px 14px 8px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div>
        <Typography.Title level={5} style={{ margin: 0 }}>{title || "Pochta e'lonlari"}</Typography.Title>
        {subtitle ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: "#888", fontSize: 12 }}>
            <EnvironmentOutlined />
            <span>{subtitle}</span>
          </div>
        ) : null}
            </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {realtimeMeta?.state ? (
          <Tag color={realtimeMeta.paused ? "default" : "processing"} style={{ borderRadius: 999, padding: "2px 10px", marginTop: 2 }}>
            {realtimeMeta.paused ? "Pauza" : realtimeMeta.state}
          </Tag>
        ) : null}
        <Tag color={tagColor} style={{ borderRadius: 999, padding: "2px 10px", marginTop: 2 }}>
          {count} ta
        </Tag>
      </div>
    </div>
  );
}
