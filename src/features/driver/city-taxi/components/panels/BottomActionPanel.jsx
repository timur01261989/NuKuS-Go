import React, { useMemo } from "react";
import { Button } from "antd";
import { CheckCircleOutlined, FlagOutlined, CloseCircleOutlined } from "@ant-design/icons";

export default function BottomActionPanel({
  mode,
  activeOrder,
  onArrived,
  onStartTrip,
  onComplete,
  onCancel,
  onOpenDetails,
}) {
  const title = useMemo(() => {
    if (!activeOrder) return "Buyurtmalarni kutyapman";
    if (mode === "goingToClient") return "Mijozga boryapsiz";
    if (mode === "arrived") return "Mijoz yonidasiz";
    if (mode === "onTrip") return "Safarda";
    if (mode === "completed") return "Yakunlandi";
    return "Tayyor";
  }, [mode, activeOrder]);

  return (
    <div style={{
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 18,
      zIndex: 950,
      borderRadius: 22,
      background: "rgba(255,255,255,0.98)",
      boxShadow: "0 14px 44px rgba(0,0,0,0.26)",
      padding: 14,
      backdropFilter: "blur(10px)"
    }}>
      <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 10 }}>{title}</div>

      {!activeOrder ? (
        <div style={{ opacity: 0.75, fontSize: 13 }}>Online bo‘lsangiz, yangi buyurtma keladi.</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {mode === "goingToClient" && (
              <Button type="primary" icon={<FlagOutlined />} onClick={onArrived}>
                Mijoz yoniga keldim
              </Button>
            )}

            {mode === "arrived" && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={onStartTrip}>
                Safarni boshlash
              </Button>
            )}

            {mode === "onTrip" && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={onComplete}>
                Safarni yakunlash
              </Button>
            )}

            <Button danger icon={<CloseCircleOutlined />} onClick={onCancel}>
              Bekor qilish
            </Button>

            <Button onClick={onOpenDetails}>Tafsilotlar</Button>
          </div>
        </>
      )}
    </div>
  );
}
