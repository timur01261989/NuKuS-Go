import React from "react";
import { Button, Tag } from "antd";
import { EnvironmentOutlined, CheckCircleOutlined } from "@ant-design/icons";

export default function ParcelCardSmall({ parcel, onAccept }) {
  const pick = parcel?.pickup_location;
  const drop = parcel?.drop_location;
  const title = parcel?.title || parcel?.parcel_type || "Posilka";
  const price = Number(parcel?.price || parcel?.amount || 0);

  return (
    <div style={{
      margin: "10px 14px",
      padding: 12,
      borderRadius: 16,
      background: "#fff",
      border: "1px solid rgba(0,0,0,.06)",
      boxShadow: "0 10px 22px rgba(0,0,0,.05)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 800 }}>{title}</div>
        <Tag color="gold" style={{ borderRadius: 999, margin: 0 }}>{price ? `${price.toLocaleString()} so'm` : "Kelishiladi"}</Tag>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: "#666", display: "grid", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <EnvironmentOutlined /> <span>{pick?.address || pick?.city || "Yuklash joyi"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: .9 }}>
          <span style={{ width: 14 }} /> <span>➜ {drop?.address || drop?.city || "Tushirish joyi"}</span>
        </div>
      </div>

      <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          style={{ borderRadius: 12 }}
          onClick={() => onAccept?.(parcel)}
        >
          Olib ketaman
        </Button>
      </div>
    </div>
  );
}
