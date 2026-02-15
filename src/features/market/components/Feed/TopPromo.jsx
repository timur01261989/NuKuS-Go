
import React from "react";

export default function TopPromo() {
  return (
    <div style={{ padding: "0 12px 12px" }}>
      <div style={{
        background: "linear-gradient(135deg,#111,#333)",
        borderRadius: 18,
        padding: 16,
        color: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,.18)"
      }}>
        <div style={{ fontSize: 13, opacity: 0.8 }}>Auto Market</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>Eng yaxshi takliflar shu yerda</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>Qidiruv + filtrlar + saqlash</div>
      </div>
    </div>
  );
}
