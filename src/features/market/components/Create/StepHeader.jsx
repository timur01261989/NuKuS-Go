
import React from "react";
import { Progress } from "antd";
import { useCreateAd } from "../../context/CreateAdContext";

export default function StepHeader({ titles = [] }) {
  const { step } = useCreateAd();
  const percent = titles.length ? Math.round(((step + 1) / titles.length) * 100) : 0;
  return (
    <div style={{ padding: "12px 12px 0" }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{titles[step] || "E'lon yaratish"}</div>
      <Progress percent={percent} showInfo={false} />
    </div>
  );
}
