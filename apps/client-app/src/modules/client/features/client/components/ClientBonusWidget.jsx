/**
 * ClientBonusWidget.jsx
 * Mijozning cashback bonus balllarini ko'rsatadi.
 * Safar yakunida RatingModal bilan birgalikda ko'rsatiladi.
 *
 * Props:
 *  - userId: string
 *  - earnedPoints: number (yangi yig'ilgan balllar)
 *  - visible: boolean
 *  - onClose: () => void
 */
import React, { useEffect, useState } from "react";
import { Modal, Button, Typography } from "antd";
import { GiftOutlined, StarOutlined } from "@ant-design/icons";
import { getClientBonuses } from "@/services/gamificationApi";

const { Title, Text } = Typography;

export default function ClientBonusWidget({ userId, earnedPoints, visible, onClose }) {
  const [total, setTotal] = useState(null);

  useEffect(() => {
    if (visible && userId) {
      getClientBonuses(userId)
        .then((d) => setTotal(d?.bonuses?.points || 0))
        .catch(() => {});
    }
  }, [visible, userId]);

  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      centered
      styles={{ body: { textAlign: "center", padding: "28px 24px" } }}
    >
      <GiftOutlined style={{ fontSize: 52, color: "#FFD700", marginBottom: 12 }} />
      <Title level={3} style={{ marginBottom: 4 }}>Cashback yig'ildi!</Title>
      <Text type="secondary">Ushbu safar uchun bonus</Text>

      <div style={{
        margin: "24px 0",
        background: "linear-gradient(135deg, #111 0%, #333 100%)",
        borderRadius: 20,
        padding: "20px 24px",
        color: "#fff",
      }}>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Yangi yig'ildi</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#FFD700" }}>
          <StarOutlined style={{ marginRight: 8, fontSize: 28 }} />
          +{earnedPoints || 0} ball
        </div>
        {total !== null && (
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 8 }}>
            Jami ballingiz: {total} ball
          </div>
        )}
      </div>

      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 20 }}>
        1 ball = 1 so'm. Keyingi safaringizda chegirma sifatida ishlatishingiz mumkin.
      </Text>

      <Button
        type="primary"
        block
        size="large"
        onClick={onClose}
        style={{ background: "#111", height: 52, borderRadius: 14, fontWeight: 800, border: "none" }}
      >
        YOPISH
      </Button>
    </Modal>
  );
}
