import React from "react";
import { Card, InputNumber, Space, Tag, Typography } from "antd";
import { DollarOutlined } from "@ant-design/icons";
import { useTrip } from "../../context/TripContext";
import { fmtMoney } from "../../utils/geo";

const { Text } = Typography;

function SeatRow({ seat, onToggle, onPrice }) {
  const color = seat.taken ? "#fff1f0" : "#f6ffed";
  const border = seat.taken ? "#ff4d4f" : "#52c41a";

  return (
    <div
      onClick={() => onToggle(seat.id)}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 140px",
        gap: 10,
        padding: 12,
        borderRadius: 14,
        border: `1px solid ${border}`,
        background: color,
        cursor: "pointer",
      }}
    >
      <Space direction="vertical" size={2}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text strong>{seat.label}</Text>
          {seat.taken ? <Tag color="red">Band</Tag> : <Tag color="green">Bo‘sh</Tag>}
        </Space>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Bosib band/bo‘sh qiling
        </Text>
      </Space>

      <div onClick={(e) => e.stopPropagation()}>
        <InputNumber
          prefix=""
          min={0}
          value={seat.price}
          onChange={(v) => onPrice(seat.id, Number(v || 0))}
          style={{ width: "100%" }}
          formatter={(v) => fmtMoney(v).replace(" so'm", "")}
          parser={(v) => Number(String(v || "0").replace(/[^0-9]/g, ""))}
        />
        <Text type="secondary" style={{ fontSize: 11 }}>
          so'm
        </Text>
      </div>
    </div>
  );
}

export default function VisualSeatSelector() {
  const { state, dispatch } = useTrip();

  return (
    <Card style={{ borderRadius: 18 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space>
            <DollarOutlined />
            <Text strong>🚘 Vizual salon (har joy narxi)</Text>
          </Space>
          <Tag>{state.seats.length} ta</Tag>
        </Space>

        <div style={{ display: "grid", gap: 10 }}>
          {state.seats.map((s) => (
            <SeatRow
              key={s.id}
              seat={s}
              onToggle={(seatId) => dispatch({ type: "TOGGLE_SEAT_TAKEN", seatId })}
              onPrice={(seatId, price) => dispatch({ type: "SET_SEAT_PRICE", seatId, price })}
            />
          ))}
        </div>
      </Space>
    </Card>
  );
}
