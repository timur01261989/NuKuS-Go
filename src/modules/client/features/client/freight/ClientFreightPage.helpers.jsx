import React from "react";
import { Tag } from "antd";

export const cpSafe = (value) => String(value ?? "");

export function statusTag(status) {
  const st = String(status || "");
  if (st === "posted") return <Tag color="blue">E’lon qilindi</Tag>;
  if (st === "offering") return <Tag color="gold">Takliflar kelyapti</Tag>;
  if (st === "driver_selected") return <Tag color="green">{cpSafe("Haydovchi tanlandi ✅")}</Tag>;
  if (st === "loading") return <Tag color="cyan">{cpSafe("Yuk joylanmoqda...")}</Tag>;
  if (st === "in_transit") return <Tag color="purple">Yo‘lda</Tag>;
  if (st === "delivered") return <Tag color="geekblue">Yetkazildi</Tag>;
  if (st === "closed") return <Tag color="green">Yopildi</Tag>;
  if (st === "cancelled") return <Tag color="red">Bekor qilindi</Tag>;
  return <Tag>{st || "-"}</Tag>;
}
