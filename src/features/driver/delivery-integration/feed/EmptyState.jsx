import React from "react";
import { Button } from "antd";
import { InboxOutlined, ReloadOutlined } from "@ant-design/icons";

export default function EmptyState({ title, desc, onRefresh }) {
  return (
    <div style={{
      padding: 18,
      margin: "12px 14px",
      borderRadius: 18,
      background: "linear-gradient(135deg, rgba(250,173,20,.10), rgba(24,144,255,.06))",
      border: "1px solid rgba(0,0,0,.06)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 16,
          background: "rgba(250,173,20,.18)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <InboxOutlined style={{ fontSize: 22, color: "#faad14" }} />
        </div>
        <div>
          <div style={{ fontWeight: 800 }}>{title || "Hozircha yuk yo'q"}</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {desc || "Yo'lingizga mos posilkalar paydo bo'lsa shu yerda chiqadi."}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={onRefresh} style={{ borderRadius: 12 }}>
          Yangilash
        </Button>
      </div>
    </div>
  );
}
