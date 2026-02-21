import React from "react";
import { Button, Tag } from "antd";
import { ArrowLeftOutlined, ThunderboltFilled } from "@ant-design/icons";

export default function TopStatusPanel({ isOnline, onToggleOnline, earnings, onOpenDetails }) {
  return (
    <div style={{
      position: "absolute",
      top: 14,
      left: 14,
      right: 14,
      zIndex: 950,
      display: "flex",
      justifyContent: "space-between",
      gap: 10,
      pointerEvents: "none",
    }}>
      <div style={{ pointerEvents: "auto", display: "flex", gap: 10, alignItems: "center" }}>
        <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} />
        <div style={{
          padding: "10px 14px",
          background: "rgba(255,255,255,0.96)",
          borderRadius: 999,
          boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
          <ThunderboltFilled style={{ color: isOnline ? "#52c41a" : "#999" }} />
          <div style={{ fontWeight: 800 }}>{isOnline ? "Online" : "Offline"}</div>
          <Button size="small" type={isOnline ? "default" : "primary"} onClick={onToggleOnline}>
            {isOnline ? "O‘chirish" : "Yoqish"}
          </Button>
        </div>
      </div>

      <div style={{ pointerEvents: "auto", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{
          padding: "10px 14px",
          background: "linear-gradient(135deg,#111 0%, #333 100%)",
          color: "#fff",
          borderRadius: 18,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          minWidth: 180
        }}>
          <div style={{ fontSize: 11, opacity: 0.85 }}>Bugungi daromad</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#52c41a" }}>
            {formatUzs(earnings.todayUzs)}
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Tag color="blue" style={{ margin: 0 }}>{earnings.tripsToday} ta safar</Tag>
            <Button size="small" onClick={onOpenDetails}>Tafsilot</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatUzs(n) {
  const v = Number(n || 0);
  return v.toLocaleString("uz-UZ") + " so‘m";
}
