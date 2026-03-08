import React, { useMemo } from "react";
import { Card, Tag, Typography } from "antd";
import { useFreight } from "../../context/FreightContext";
import { formatUZS } from "../../services/truckData";
import { useClientText } from "../../../shared/i18n_clientLocalize";
const { Text } = Typography;

export default function PriceEstimator() {
  const { truck, distanceKm, durationMin, loadersFee, estimatedPrice } = useFreight();
  const { cp } = useClientText();
  const kmLabel = useMemo(() => (Number.isFinite(distanceKm) ? `${distanceKm.toFixed(distanceKm < 10 ? 2 : 1)} km` : "—"), [distanceKm]);
  const minLabel = useMemo(() => (Number.isFinite(durationMin) ? `${Math.round(durationMin)} daq` : "—"), [durationMin]);

  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 1000, fontSize: 14 }}>{truck?.title}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{truck?.subtitle}</Text>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag color="green" style={{ margin: 0 }}>{kmLabel}</Tag>
            <Tag color="blue" style={{ margin: 0 }}>{minLabel}</Tag>
            {loadersFee > 0 && <Tag color="gold" style={{ margin: 0 }}>{cp("Gruzchik:") || "Gruzchik:"} {formatUZS(loadersFee)}</Tag>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, opacity: 0.7 }}>{cp("Taxminiy narx")}</div>
          <div style={{ fontWeight: 1000, fontSize: 20 }}>{formatUZS(estimatedPrice)}</div>
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>{cp("Narx yo‘l sharoiti va yukga qarab o‘zgarishi mumkin.")}</div>
    </Card>
  );
}
