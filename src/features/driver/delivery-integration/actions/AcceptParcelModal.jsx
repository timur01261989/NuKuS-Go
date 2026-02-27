import React, { useMemo, useState } from "react";
import { Modal, Typography, Tag, Button, Space, Input } from "antd";
import { InboxOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

export default function AcceptParcelModal({ open, parcel, onCancel, onAccept, loading }) {
  const [note, setNote] = useState("");

  const priceText = useMemo(() => {
    const p = Number(parcel?.price || parcel?.amount || 0);
    return p ? `${p.toLocaleString()} so'm` : "Kelishiladi";
  }, [parcel]);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      title={<Space><InboxOutlined /><span>Posilkani qabul qilish</span></Space>}
    >
      {!parcel ? (
        <Typography.Text type="secondary">Ma'lumot yo'q</Typography.Text>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 900 }}>{parcel?.title || "Posilka"}</div>
              <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Tag style={{ borderRadius: 999, margin: 0 }}>{(parcel?.capacity || parcel?.size || "M").toUpperCase()}</Tag>
                <Tag color="gold" style={{ borderRadius: 999, margin: 0 }}>{priceText}</Tag>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
            <div><b>Yuklash:</b> {parcel?.pickup_location?.address || parcel?.pickup_location?.city || "—"}</div>
            <div><b>Tushirish:</b> {parcel?.drop_location?.address || parcel?.drop_location?.city || "—"}</div>
          </div>

          <Input.TextArea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Izoh (ixtiyoriy). Masalan: '5 daqiqada yetaman'"
            rows={3}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <Space>
              <Button icon={<CloseCircleOutlined />} onClick={onCancel} disabled={loading}>
                Bekor
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={loading}
                onClick={() => onAccept?.({ parcel, note })}
                style={{ borderRadius: 12 }}
              >
                Qabul qilish
              </Button>
            </Space>
          </div>
        </>
      )}
    </Modal>
  );
}
