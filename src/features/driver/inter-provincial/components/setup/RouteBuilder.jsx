import React, { useMemo, useState } from "react";
import { Card, Input, Space, Tag, Typography, Switch, Select } from "antd";
import { EnvironmentOutlined, WomanOutlined } from "@ant-design/icons";
import { useTrip } from "../../context/TripContext";
import { FEMALE_MODE } from "../../context/tripReducer";

const { Text } = Typography;

export default function RouteBuilder() {
  const { state, dispatch } = useTrip();
  const [from, setFrom] = useState(state.route.from);
  const [to, setTo] = useState(state.route.to);
  const [transit, setTransit] = useState(state.route.transit || []);

  const femaleValue = state.femaleMode;

  const femaleOptions = [
    { value: FEMALE_MODE.OFF, label: "O'chirilgan" },
    { value: FEMALE_MODE.ALL_FEMALE, label: "Faqat ayollar uchun" },
    { value: FEMALE_MODE.BACK_ONLY, label: "Orqa o'rindiq ayollar uchun" },
  ];

  const saveRoute = () => {
    dispatch({ type: "SET_ROUTE", route: { from, to, transit } });
  };

  const badge = useMemo(() => {
    if (femaleValue === FEMALE_MODE.ALL_FEMALE) return <Tag color="magenta">🚺 Female Only</Tag>;
    if (femaleValue === FEMALE_MODE.BACK_ONLY) return <Tag color="pink">🚺 Backseat Female</Tag>;
    return <Tag>Oddiy</Tag>;
  }, [femaleValue]);

  return (
    <Card style={{ borderRadius: 18 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space>
            <EnvironmentOutlined />
            <Text strong>Reys yo'nalishi</Text>
          </Space>
          {badge}
        </Space>

        <Input value={from} onChange={(e) => setFrom(e.target.value)} onBlur={saveRoute} placeholder="Qayerdan (masalan: Nukus)" />
        <Input value={to} onChange={(e) => setTo(e.target.value)} onBlur={saveRoute} placeholder="Qayerga (masalan: Toshkent)" />

        <Text type="secondary" style={{ fontSize: 12 }}>
          (Tranzit) Keyin qo'shamiz: Nukus → Buxoro → Samarqand kabi
        </Text>

        <Card style={{ borderRadius: 14, background: "#fff0f6", border: "1px solid #ffadd2" }} bodyStyle={{ padding: 12 }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Space>
              <WomanOutlined />
              <Text strong>Ayollar uchun rejim</Text>
            </Space>
            <Select
              value={femaleValue}
              options={femaleOptions}
              onChange={(v) => dispatch({ type: "SET_FEMALE_MODE", mode: v })}
              style={{ minWidth: 220 }}
            />
          </Space>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
            * Erkaklar female-only joylarni band qila olmaydi (klient tomonda tekshiriladi).
          </Text>
        </Card>
      </Space>
    </Card>
  );
}
