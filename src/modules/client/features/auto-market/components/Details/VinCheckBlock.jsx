import React from "react";
import { Card, Button } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import inspectionIcon from "@/assets/auto-market/pro/inspection/inspection-icon.png";
import certificateArt from "@/assets/auto-market/pro/inspection/inspection-certificate.png";

export default function VinCheckBlock({ vin }) {
  return (
    <Card style={{ borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden" }} styles={{ body: { padding: 14 } }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{
            width: 42, height: 42, borderRadius: 16,
            background: "linear-gradient(135deg,#a78bfa,#7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff",
            boxShadow: "0 14px 30px rgba(124,58,237,.22)"
          }}>
            <SafetyCertificateOutlined />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>VIN va tarix tekshiruvi</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              VIN, texnik tarix, ta’mir izi va ehtimoliy cheklovlarni bir joyda tekshirish mumkin.
            </div>
            <div style={{ marginTop: 8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, color: "#0f172a" }}>
              {vin ? vin : "VIN ko'rsatilmagan"}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, background: "#eff6ff", color: "#1d4ed8", padding: "4px 10px", borderRadius: 999 }}>Avariya izi</span>
              <span style={{ fontSize: 11, background: "#ecfdf5", color: "#047857", padding: "4px 10px", borderRadius: 999 }}>Servis tarixi</span>
              <span style={{ fontSize: 11, background: "#faf5ff", color: "#7c3aed", padding: "4px 10px", borderRadius: 999 }}>Cheklov nazorati</span>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
          <img src={inspectionIcon} alt="" style={{ width: 34, height: 34, objectFit: "contain" }} />
          <img src={certificateArt} alt="" style={{ width: 90, objectFit: "contain" }} />
          <Button disabled={!vin} type="primary" style={{ borderRadius: 12, background: "#7c3aed", border: "none" }}>
            Tekshirish
          </Button>
        </div>
      </div>
    </Card>
  );
}