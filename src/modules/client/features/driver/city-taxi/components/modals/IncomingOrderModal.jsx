import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Tag } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, EnvironmentOutlined } from "@ant-design/icons";

export default function IncomingOrderModal({ order, visible, onAccept, onDecline }) {
  const [sec, setSec] = useState(18);

  useEffect(() => {
    if (!visible) return;
    setSec(18);
    const t = setInterval(() => setSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (sec <= 0) onDecline?.();
  }, [sec, visible, onDecline]);

  const price = useMemo(() => {
    const v = Number(order?.priceUzs || 0);
    return v ? v.toLocaleString("uz-UZ") + " so‘m" : "Narx: noma’lum";
  }, [order?.priceUzs]);

  return (
    <Modal
      title="Yangi buyurtma"
      open={visible}
      footer={null}
      closable={false}
      centered
    >
      {!order ? null : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Tag color="gold">Yangi</Tag>
            <Tag color="blue">{sec}s</Tag>
          </div>

          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            <RowItem label="Olish" value={order.pickup_address || "-"} />
            <RowItem label="Borish" value={order.dropoff_address || "-"} />
            <div style={{ fontWeight: 900, fontSize: 18 }}>{price}</div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={onAccept} block>
              Qabul qilish
            </Button>
            <Button danger icon={<CloseCircleOutlined />} onClick={onDecline} block>
              Rad etish
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

function RowItem({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <EnvironmentOutlined />
      <div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
        <div style={{ fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}
