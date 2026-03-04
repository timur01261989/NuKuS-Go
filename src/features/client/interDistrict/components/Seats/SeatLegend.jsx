import React from "react";
import { Card, Tag, Typography } from "antd";

/**
 * SeatLegend.jsx
 * -------------------------------------------------------
 * Ranglar ma'nosi.
 * * "YAGONA REYS" QO'SHIMCHALARI: Jins (Gender) va qulf belgilari izohi qo'shildi.
 */
export default function SeatLegend() {
  return (
    <Card style={{ borderRadius: 18 }}>
      <Typography.Text style={{ fontWeight: 700 }}>Belgilash</Typography.Text>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {/* Eski kod (o'zgarishsiz qoldirildi) */}
        <Tag color="green">Yashil = bo‘sh</Tag>
        <Tag color="red">Qizil = band</Tag>

        {/* YANGI QO'SHILGANLAR (Yagona Reys tizimi uchun) */}
        <Tag color="blue" style={{ border: 0, fontWeight: 500 }}>👨 = Erkak yo'lovchi</Tag>
        <Tag color="magenta" style={{ border: 0, fontWeight: 500 }}>👩 = Ayol yo'lovchi</Tag>
        <Tag color="default" style={{ border: 0, fontWeight: 500 }}>🔒 = Tizim qulflagan</Tag>
      </div>
    </Card>
  );
}