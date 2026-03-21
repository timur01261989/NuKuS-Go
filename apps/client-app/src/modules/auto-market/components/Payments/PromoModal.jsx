import React from "react";
import { Modal, Radio, message, Space } from "antd";
import { paymentAssets } from "@/assets/payment";
import { assetStyles } from "@/assets/assetPolish";
import { buyPromotion } from "../../services/marketBackend";

const OPTIONS = [
  { key: "top_1day", title: "TOP 1 kun", hint: "E'lon 1 kun TOP bo'ladi", icon: "success" },
  { key: "top_3day", title: "TOP 3 kun", hint: "E'lon 3 kun TOP bo'ladi", icon: "success" },
  { key: "vip_7day", title: "VIP 7 kun", hint: "VIP belgisi + ko'proq ko'rinish", icon: "warning" },
  { key: "raise", title: "Ko'tarish", hint: "Ro'yxatda yuqoriga chiqarish", icon: "default" },
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
      title={<Space><img src={paymentAssets.actions.addCardAlt || paymentAssets.actions.addCard} alt="promo" style={assetStyles.promoTitleIcon} /><span>🚀 E'lonni reklama qilish</span></Space>}
    >
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #e2e8f0", borderRadius: 16, padding: 12, background: "#f8fafc" }}>
          <img src={paymentAssets.bonus.bonusExtra || paymentAssets.bonus.bonusBadge} alt="" style={assetStyles.promoBonusImage} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>Wallet va promo</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              To'lov walletdan yechiladi. Balans yetmasa — TopUp qiling.
            </div>
          </div>
          <img src={paymentAssets.states.warningAlt || paymentAssets.states.warning} alt="" style={assetStyles.promoStateIcon} />
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
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img
                      src={
                        o.icon === "success"
                          ? (paymentAssets.states.successAlt || paymentAssets.states.success)
                          : o.icon === "warning"
                            ? (paymentAssets.states.warningAlt || paymentAssets.states.warning)
                            : paymentAssets.cards.defaultAlt || paymentAssets.cards.default
                      }
                      alt=""
                      style={o.icon === "default" ? { width: 24, height: 24, objectFit: "contain" } : assetStyles.promoStateIcon}
                    />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 900 }}>{o.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{o.hint}</div>
                  </div>
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
