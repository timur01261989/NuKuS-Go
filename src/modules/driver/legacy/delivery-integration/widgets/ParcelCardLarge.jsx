import React from "react";
import { Button, Tag } from "antd";
import { EnvironmentOutlined, PhoneOutlined, CheckCircleOutlined, PictureOutlined } from "@ant-design/icons";

export default function ParcelCardLarge({ parcel, onAccept }) {
  const pick = parcel?.pickup_location;
  const drop = parcel?.drop_location;
  const title = parcel?.title || "Posilka";
  const weight = parcel?.weight_kg ? `${parcel.weight_kg} kg` : null;
  const price = Number(parcel?.price || parcel?.amount || 0);
  const receiverPhone = parcel?.receiver_phone || parcel?.receiver?.phone || "";
  const photos = parcel?.photos || parcel?.images || [];

  return (
    <div style={{
      margin: "12px 14px",
      padding: 14,
      borderRadius: 18,
      background: "#fff",
      border: "1px solid rgba(0,0,0,.06)",
      boxShadow: "0 12px 28px rgba(0,0,0,.06)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 15 }}>{title}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag color="blue" style={{ borderRadius: 999, margin: 0 }}>{(parcel?.capacity || parcel?.size || "M").toUpperCase()}</Tag>
            {weight ? <Tag style={{ borderRadius: 999, margin: 0 }}>{weight}</Tag> : null}
            {photos?.length ? <Tag icon={<PictureOutlined />} style={{ borderRadius: 999, margin: 0 }}>{photos.length} rasm</Tag> : null}
          </div>
        </div>
        <Tag color="gold" style={{ borderRadius: 999, margin: 0, height: "fit-content" }}>
          {price ? `${price.toLocaleString()} so'm` : "Kelishiladi"}
        </Tag>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: "#666", display: "grid", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <EnvironmentOutlined /> <span><b>Yuklash:</b> {pick?.address || pick?.city || "—"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <EnvironmentOutlined /> <span><b>Tushirish:</b> {drop?.address || drop?.city || "—"}</span>
        </div>
        {receiverPhone ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PhoneOutlined /> <span><b>Qabul qiluvchi:</b> {receiverPhone}</span>
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
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
