import React from "react";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { buildPromotePackages } from "../services/autoMarketSellerStudio";

export default function PromoteListingPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const packages = buildPromotePackages({ id, images: new Array(6).fill("asset") });
  return (
    <div style={{ padding: 16, display: "grid", gap: 14 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} style={{ width: "fit-content", borderRadius: 12 }}>Orqaga</Button>
      <div>
        <div style={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>Promote listing</div>
        <div style={{ marginTop: 6, color: "#64748b" }}>E’lonni premium yoki showroom ko‘rinishiga olib chiqish uchun paket tanlang.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {packages.map((item) => (
          <div key={item.key} style={{ borderRadius: 20, padding: 16, background: `${item.accent}10`, border: `1px solid ${item.accent}22` }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
              {item.recommended ? <span style={{ fontSize: 11, color: item.accent, fontWeight: 900 }}>TAVSIYA</span> : null}
            </div>
            <div style={{ marginTop: 10, color: "#475569", fontSize: 13, lineHeight: 1.5 }}>{item.text}</div>
            <div style={{ marginTop: 14, fontWeight: 950, color: item.accent }}>{item.price.toLocaleString("en-US")} UZS</div>
            <Button type="primary" style={{ marginTop: 14, borderRadius: 12, background: item.accent, border: "none" }} onClick={() => nav("/auto-market/my-ads")}>
              Paketni tanlash
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
