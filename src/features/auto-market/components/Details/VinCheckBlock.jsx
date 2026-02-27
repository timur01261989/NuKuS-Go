import React from "react";
import { Card, Button } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";

export default function VinCheckBlock({ vin }) {
  return (
    <Card
      style={{ borderRadius: 18, border: "1px solid #e2e8f0" }}
      bodyStyle={{ padding: 14 }}
    >
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
          <div style={{ fontWeight: 900, color: "#0f172a" }}>VIN tekshiruv</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            VIN orqali texnik tarix / avariya / cheklovlarni tekshirish mumkin.
          </div>
          <div style={{ marginTop: 8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, color: "#0f172a" }}>
            {vin ? vin : "VIN ko'rsatilmagan"}
          </div>
        </div>
        <Button disabled={!vin} type="primary" style={{ borderRadius: 12, background: "#7c3aed", border: "none" }}>
          Tekshirish
        </Button>
      </div>
    </Card>
  );
}
