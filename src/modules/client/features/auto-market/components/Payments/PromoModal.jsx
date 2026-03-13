import React from "react";
import { Modal, Radio, message } from "antd";
import { buyPromotion } from "../../services/marketBackend";

const OPTIONS = [
  { key: "top_1day", title: "TOP 1 kun", hint: "E'lon 1 kun TOP bo'ladi" },
  { key: "top_3day", title: "TOP 3 kun", hint: "E'lon 3 kun TOP bo'ladi" },
  { key: "vip_7day", title: "VIP 7 kun", hint: "VIP belgisi + ko'proq ko'rinish" },
  { key: "raise", title: "Ko'tarish", hint: "Ro'yxatda yuqoriga chiqarish" },
];

export default function PromoModal({ open, onClose, adId, onNeedTopup, onSuccess }) {
  const [value, setValue] = React.useState("top_1day");
  const [loading, setLoading] = React.useState(false);

  const onOk = async () => {
    try {
      setLoading(true);
      const res = await buyPromotion({ ad_id: adId, promo_type: value });
      if (res?.ok) {
        message.success("✅ Promo aktiv qilindi");
        onSuccess?.(res);
        onClose?.();
        return;
      }
      message.error(res?.error || "Promo xatosi");
    } catch (e) {
      // Insufficient balance comes as 402 with message from axiosClient
      const msg = e?.message || "Promo xatosi";
      if (msg.toLowerCase().includes("balans") || msg.toLowerCase().includes("402") || msg.toLowerCase().includes("enough")) {
        onNeedTopup?.({ reason: "promo" });
        onClose?.();
        return;
      }
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onOk}
      okText="Sotib olish"
      cancelText="Bekor"
      confirmLoading={loading}
      title="🚀 E'lonni reklama qilish"
    >
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          To'lov walletdan yechiladi. Balans yetmasa — TopUp qiling.
        </div>
        <Radio.Group
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ width: "100%" }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            {OPTIONS.map((o) => (
              <div
                key={o.key}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>{o.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{o.hint}</div>
                </div>
                <Radio value={o.key} />
              </div>
            ))}
          </div>
        </Radio.Group>
      </div>
    </Modal>
  );
}
