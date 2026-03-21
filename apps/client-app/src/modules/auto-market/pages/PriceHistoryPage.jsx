import React from "react";
import { Button, Card, Tag } from "antd";
import { ArrowLeftOutlined, RiseOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { buildPriceHistorySummary } from "../services/autoMarketMarketplaceFinal";
import PriceTag from "../components/Common/PriceTag";
import useCarDetails from "../hooks/useCarDetails";

export default function PriceHistoryPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const { car } = useCarDetails(id);
  const history = buildPriceHistorySummary(car || { id, price: 285000000 });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 120 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} />
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Price history</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Narx o‘zgarishi va bozor signallari</div>
        </div>
      </div>

      <div style={{ padding: 16, display: "grid", gap: 16 }}>
        <Card style={{ borderRadius: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{history.summary}</div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#475569" }}>Bozor bilan solishtirilgan narx harakati: <strong>{history.deltaText}</strong></div>
            </div>
            <Tag color="blue" style={{ margin: 0, borderRadius: 999 }} icon={<RiseOutlined />}>Bozor pulse</Tag>
          </div>

          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            {history.points.map((point) => (
              <div key={point.key} style={{ borderRadius: 18, border: "1px solid #e2e8f0", padding: 14, background: "#f8fafc", display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ color: "#475569" }}>{point.label}</div>
                <div style={{ fontWeight: 900, color: "#0f172a" }}><PriceTag value={point.value} /></div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ borderRadius: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>Keyingi eng foydali qadamlar</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
            {history.nextBestActions.map((item) => (
              <button key={item.key} type="button" onClick={() => nav(item.route)} style={{ cursor: "pointer", textAlign: "left", borderRadius: 18, border: "1px solid #e2e8f0", background: "#fff", padding: 14 }}>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>{item.route}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
