import React, { useMemo } from "react";
import { Button, Card, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export default function TripCard({ trip, onRequest }) {
  const depart = useMemo(() => {
    try { return dayjs(trip?.depart_at).format("YYYY-MM-DD HH:mm"); } catch { return ""; }
  }, [trip?.depart_at]);

  const features = useMemo(() => {
    const f = [];
    if (trip?.has_ac) f.push(<Tag key="ac">AC</Tag>);
    if (trip?.has_trunk) f.push(<Tag key="trunk">Yukxona</Tag>);
    if (trip?.is_lux) f.push(<Tag key="lux">Lux</Tag>);
    if (trip?.allow_smoking) f.push(<Tag key="smoke">Sigaret</Tag>);
    if (trip?.has_delivery) f.push(<Tag key="del">Eltish</Tag>);
    return f;
  }, [trip]);

  return (
    <Card
      style={{ borderRadius: 16, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)" }}
      bodyStyle={{ padding: 14 }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={8}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700 }}>
              {trip?.from_district} → {trip?.to_district}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {trip?.region} · {trip?.mode === "pitak" ? "Pitak" : "Manzildan"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700 }}>{depart}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {trip?.seats_available}/{trip?.seats_total} joy
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{features}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
          <div>
            <Text type="secondary">Yo‘l haqi:</Text> <b>{Number(trip?.base_price_uzs || 0).toLocaleString()} UZS</b>
          </div>
          <div>
            <Text type="secondary">Polni salon:</Text>{" "}
            {trip?.allow_full_salon ? <b>{Number(trip?.full_salon_price_uzs || 0).toLocaleString()} UZS</b> : "Yo‘q"}
          </div>
          <div>
            <Text type="secondary">Uyidan olib ketish:</Text> {Number(trip?.pickup_fee_uzs || 0).toLocaleString()} UZS
          </div>
          <div>
            <Text type="secondary">Uyiga olib borish:</Text> {Number(trip?.dropoff_fee_uzs || 0).toLocaleString()} UZS
          </div>
        </div>

        {trip?.notes ? <div style={{ fontSize: 12, opacity: 0.85 }}>Izoh: {trip.notes}</div> : null}

        <Button type="primary" onClick={() => onRequest?.(trip)} block>
          So‘rov yuborish
        </Button>
      </Space>
    </Card>
  );
}
