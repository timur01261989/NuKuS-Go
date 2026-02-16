import React from "react";
import { Card, Button, Rate } from "antd";
import { PhoneOutlined, MessageOutlined, UserOutlined } from "@ant-design/icons";

export default function SellerProfile({ seller, onChat }) {
  const s = seller || {};
  return (
    <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 14 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{
          width: 46, height: 46, borderRadius: 18,
          background: "linear-gradient(135deg,#0ea5e9,#22c55e)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 900,
          boxShadow: "0 14px 30px rgba(14,165,233,.18)"
        }}>
          <UserOutlined />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>{s.name || "Sotuvchi"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <Rate allowHalf disabled value={Number(s.rating || 4.8)} style={{ fontSize: 14 }} />
            <span style={{ fontSize: 12, color: "#64748b" }}>{Number(s.rating || 4.8).toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <Button
          type="primary"
          icon={<PhoneOutlined />}
          style={{ borderRadius: 14, flex: 1, background: "#0ea5e9", border: "none" }}
          onClick={() => {
            if (!s.phone) return;
            window.location.href = `tel:${s.phone}`;
          }}
        >
          Tel qilish
        </Button>
        <Button
          icon={<MessageOutlined />}
          style={{ borderRadius: 14, flex: 1, border: "1px solid #e2e8f0" }}
          onClick={onChat}
        >
          Chat
        </Button>
      </div>
      {s.phone ? <div style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>Raqam: {s.phone}</div> : null}
    </Card>
  );
}
