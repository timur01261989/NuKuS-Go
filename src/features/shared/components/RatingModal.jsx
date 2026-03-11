/**
 * RatingModal.jsx
 * Safar tugagandan keyin mijozdan haydovchini baholashni so'raydi.
 *
 * Qanday ishlaydi:
 *  1. Yulduzcha tanlaydi (1-5)
 *  2. Tez tanlash teglari (Yandex Go uslubi)
 *  3. Ixtiyoriy matn izoh
 *  4. Submit: order_ratings jadvaliga yozadi
 *  5. Supabase Trigger (supabase_new_tables.sql) driver_stats.rating_avg'ni yangilaydi
 *
 * Props:
 *  - visible: boolean
 *  - order: { id, driver_id, user_id }
 *  - onFinish: () => void  — yopish / keyingi qadam
 */
import React, { useState } from "react";
import { Modal, Rate, Input, Button, Typography, Space, Tag, message } from "antd";
import { StarFilled, SmileOutlined, MehOutlined, FrownOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/shared/i18n/useLanguage";

const { Title, Text } = Typography;
const { TextArea } = Input;

// Yaxshi baho (4-5) uchun teg'lar
export default function RatingModal({ visible, order, onFinish }) {
  const { tr } = useLanguage();
  const GOOD_TAGS = [
    { label: tr("rating.cleanliness", "Tozalik"), emoji: "🧼" },
    { label: tr("rating.politeCommunication", "Yoqimli muloqot"), emoji: "😊" },
    { label: tr("rating.arrivedFast", "Tez keldi"), emoji: "⚡" },
    { label: tr("rating.safeDriving", "Xavfsiz haydash"), emoji: "🛡️" },
    { label: tr("rating.music", "Muzika yoqdi"), emoji: "🎵" },
    { label: tr("rating.knowsRoute", "Yo'l bildi"), emoji: "🗺️" },
  ];

  const BAD_TAGS = [
    { label: tr("rating.arrivedLate", "Kech keldi"), emoji: "⏰" },
    { label: tr("rating.rudeCommunication", "Qo'pol muloqot"), emoji: "😤" },
    { label: tr("rating.droveFast", "Tez haydadi"), emoji: "💨" },
    { label: tr("rating.unpleasantCar", "Mashina yoqimli emas"), emoji: "🚗" },
  ];
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);

  const isGood = stars >= 4;
  const tags = isGood ? GOOD_TAGS : BAD_TAGS;

  const toggleTag = (label) => {
    setSelectedTags((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  };

  // Yulduz o'zgarsa — teg'larni tozalash
  const handleStarsChange = (val) => {
    setStars(val);
    setSelectedTags([]);
  };

  const handleSubmit = async () => {
    if (!order?.id) {
      onFinish?.();
      return;
    }
    setLoading(true);
    try {
      const fullComment = [
        selectedTags.length ? selectedTags.join(", ") : null,
        comment.trim() || null,
      ]
        .filter(Boolean)
        .join(" | ");

      const { error } = await supabase.from("order_ratings").insert([
        {
          order_id: order.id,
          from_user_id: order.user_id || order.client_id || null,
          to_user_id: order.driver_id || null,
          role: "client_rates_driver",
          stars,
          comment: fullComment || null,
        },
      ]);

      if (error) {
        // Duplicate reyting — foydalanuvchi qayta ko'rsatganida
        if (error.code === "23505") {
          message.info(tr("rating.alreadyRated", "Siz allaqachon baholagan edingiz"));
          onFinish?.();
          return;
        }
        throw error;
      }

      message.success(tr("rating.thanks", "Bahoingiz uchun rahmat!"));
      onFinish?.();
    } catch (err) {
      message.error(`${tr("common.error", "Xatolik")}: ${err.message || tr("rating.saveFailed", "Baholash saqlanmadi")}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onFinish?.();
  };

  // Yuz ikonkasi — reytingga qarab
  const FaceIcon =
    stars >= 4 ? (
      <SmileOutlined style={{ fontSize: 48, color: "#52c41a" }} />
    ) : stars >= 3 ? (
      <MehOutlined style={{ fontSize: 48, color: "#faad14" }} />
    ) : (
      <FrownOutlined style={{ fontSize: 48, color: "#ff4d4f" }} />
    );

  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      centered
      bodyStyle={{ textAlign: "center", padding: "28px 24px" }}
    >
      <div style={{ marginBottom: 16 }}>{FaceIcon}</div>

      <Title level={3} style={{ marginBottom: 4 }}>
        {tr("rating.tripHowWasIt", "Safar qanday o'tdi?")}
      </Title>
      <Text type="secondary">{tr("rating.rateDriverService", "Haydovchining xizmatini baholang")}</Text>

      {/* Yulduzchalar */}
      <div style={{ margin: "20px 0 16px" }}>
        <Rate
          allowHalf={false}
          value={stars}
          onChange={handleStarsChange}
          style={{ fontSize: 44, color: "#FFD700" }}
        />
      </div>

      {/* Tez tanlash teglari */}
      {stars > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Space wrap size={[8, 8]} style={{ justifyContent: "center" }}>
            {tags.map((tag) => (
              <Tag
                key={tag.label}
                onClick={() => toggleTag(tag.label)}
                style={{
                  cursor: "pointer",
                  borderRadius: 20,
                  padding: "4px 14px",
                  fontSize: 13,
                  background: selectedTags.includes(tag.label) ? "#111" : "#f5f5f5",
                  color: selectedTags.includes(tag.label) ? "#fff" : "#333",
                  border: "none",
                  userSelect: "none",
                  transition: "all 0.15s",
                }}
              >
                {tag.emoji} {tag.label}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* Ixtiyoriy matn */}
      <TextArea
        placeholder={tr("rating.leaveCommentOptional", "Fikringizni qoldiring (ixtiyoriy)...")}
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ borderRadius: 12, marginBottom: 16, resize: "none" }}
        maxLength={300}
      />

      {/* Yuborish tugmasi */}
      <Button
        type="primary"
        block
        size="large"
        loading={loading}
        disabled={stars === 0}
        onClick={handleSubmit}
        style={{
          background: "#111",
          height: 52,
          borderRadius: 14,
          fontWeight: 800,
          fontSize: 16,
          border: "none",
        }}
      >
        {tr("common.submitUpper", "YUBORISH")}
      </Button>

      {/* O'tkazib yuborish */}
      <Button
        type="text"
        block
        onClick={handleSkip}
        style={{ marginTop: 10, color: "#999", fontSize: 13 }}
      >
        {tr("common.skip", "O'tkazib yuborish")}
      </Button>
    </Modal>
  );
}
