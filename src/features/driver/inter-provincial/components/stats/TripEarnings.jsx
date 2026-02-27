import React, { useMemo, useState } from "react";
import { Card, InputNumber, Space, Tag, Typography } from "antd";
import { useTrip } from "../../context/TripContext";
import { fmtMoney } from "../../utils/geo";

const { Text } = Typography;

export default function TripEarnings() {
  const { state } = useTrip();
  const [fuelCost, setFuelCost] = useState(250000);

  const seatsIncome = useMemo(() => {
    return state.seats.reduce((sum, s) => sum + (s.taken ? (s.price || 0) : 0), 0);
  }, [state.seats]);

  const parcelIncome = useMemo(() => state.parcels.reduce((s, p) => s + (p.fee || 0), 0), [state.parcels]);
  const profit = Math.max(0, seatsIncome + parcelIncome - Number(fuelCost || 0));

  return (
    <Card style={{ borderRadius: 18 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Text strong>📈 Hisob-kitob</Text>

        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text type="secondary">Yo'lovchilar tushumi</Text>
          <Tag color="green">{fmtMoney(seatsIncome)}</Tag>
        </Space>

        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text type="secondary">Posilka tushumi</Text>
          <Tag color="gold">{fmtMoney(parcelIncome)}</Tag>
        </Space>

        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text type="secondary">Benzin harajati</Text>
          <InputNumber
            value={fuelCost}
            onChange={setFuelCost}
            min={0}
            step={5000}
            style={{ width: 180 }}
            formatter={(v) => fmtMoney(v).replace(" so'm", "")}
            parser={(v) => Number(String(v || "0").replace(/[^0-9]/g, ""))}
          />
        </Space>

        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text strong>Sof foyda</Text>
          <Tag color="purple">{fmtMoney(profit)}</Tag>
        </Space>
      </Space>
    </Card>
  );
}
