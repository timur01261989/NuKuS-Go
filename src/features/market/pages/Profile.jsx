
import React from "react";
import { Button } from "antd";
import MarketLayout from "../layouts/MarketLayout";
import MarketHeader from "../components/Common/MarketHeader";

export default function Profile() {
  return (
    <MarketLayout>
      <MarketHeader title="Profil" />
      <div style={{ padding: 12 }}>
        <div style={{ background: "white", border: "1px solid #f0f0f0", borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Foydalanuvchi</div>
          <div style={{ color: "#777", marginTop: 6 }}>Demo profil (backend ulansa real bo'ladi).</div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Button style={{ borderRadius: 12 }}>Sozlamalar</Button>
            <Button danger style={{ borderRadius: 12 }}>Chiqish</Button>
          </div>
        </div>
      </div>
    </MarketLayout>
  );
}
