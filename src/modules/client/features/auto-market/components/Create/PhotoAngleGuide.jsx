import React from "react";
import { Card, Tag } from "antd";
import front from "@/assets/auto-market/pro/inspection/photo-angle-front.png";
import back from "@/assets/auto-market/pro/inspection/photo-angle-back.png";
import left from "@/assets/auto-market/pro/inspection/photo-angle-left.png";
import right from "@/assets/auto-market/pro/inspection/photo-angle-right.png";
import frontLeft from "@/assets/auto-market/pro/inspection/photo-angle-front-left.png";
import frontRight from "@/assets/auto-market/pro/inspection/photo-angle-front-right.png";
import rearLeft from "@/assets/auto-market/pro/inspection/photo-angle-rear-left.png";
import rearRight from "@/assets/auto-market/pro/inspection/photo-angle-rear-right.png";
import registration from "@/assets/auto-market/pro/inspection/photo-angle-registration.png";

import { buildPhotoCoachNotes } from "../../services/autoMarketJourney";

const angles = [
  { key: "front", label: "Old tomoni", asset: front },
  { key: "front-left", label: "Old chap diagonal", asset: frontLeft },
  { key: "front-right", label: "Old o‘ng diagonal", asset: frontRight },
  { key: "left", label: "Chap tomoni", asset: left },
  { key: "right", label: "O‘ng tomoni", asset: right },
  { key: "back", label: "Orqa tomoni", asset: back },
  { key: "rear-left", label: "Orqa chap diagonal", asset: rearLeft },
  { key: "rear-right", label: "Orqa o‘ng diagonal", asset: rearRight },
  { key: "registration", label: "Raqam va hujjat", asset: registration },
];

export default function PhotoAngleGuide({ images = [] }) {
  const uploaded = Array.isArray(images) ? images.length : 0;
  const coachNotes = buildPhotoCoachNotes();
  return (
    <Card style={{ marginTop: 14, borderRadius: 18, border: "1px solid #e2e8f0" }} styles={{ body: { padding: 14 } }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Professional foto reja</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Xaridor mashinani aylanib ko‘rgandek his qilsin.</div>
        </div>
        <Tag color={uploaded >= 8 ? "green" : "blue"} style={{ borderRadius: 999, paddingInline: 10 }}>{uploaded}/9 rasm</Tag>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 12 }}>
        {angles.map((item, index) => (
          <div key={item.key} style={{ borderRadius: 16, border: "1px solid #e2e8f0", padding: 10, background: index < uploaded ? "rgba(22,163,74,.06)" : "#fff" }}>
            <img src={item.asset} alt={item.label} style={{ width: "100%", height: 60, objectFit: "contain" }} />
            <div style={{ fontSize: 11, color: "#334155", marginTop: 8, fontWeight: 700 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}