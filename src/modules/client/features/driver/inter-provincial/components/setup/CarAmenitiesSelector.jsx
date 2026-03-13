import React, { useMemo } from "react";
import { Card, Checkbox, Space, Typography } from "antd";
import { ThunderboltOutlined, ApiOutlined, UsbOutlined, InboxOutlined, SoundOutlined } from "@ant-design/icons";
import { useTrip } from "../../context/TripContext";
import { AMENITIES } from "../../context/tripReducer";

const { Text } = Typography;

const iconByKey = {
  AC: <ApiOutlined />,
  USB: <UsbOutlined />,
  LUGGAGE: <InboxOutlined />,
  NO_SMOKE: <ThunderboltOutlined />,
  MUSIC: <SoundOutlined />,
};

export default function CarAmenitiesSelector() {
  const { state, dispatch } = useTrip();

  const options = useMemo(
    () =>
      AMENITIES.map((a) => ({
        label: (
          <Space>
            {iconByKey[a.key] || null}
            <span>{a.label}</span>
          </Space>
        ),
        value: a.label,
      })),
    []
  );

  return (
    <Card style={{ borderRadius: 18 }}>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Text strong>❄️ Konfor belgilari</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Mijozga ko'rinadi: nima uchun aynan sizni tanlashi kerak?
        </Text>

        <Checkbox.Group
          options={options}
          value={state.amenities}
          onChange={(vals) => dispatch({ type: "SET_AMENITIES", amenities: vals })}
        />
      </Space>
    </Card>
  );
}
