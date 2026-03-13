import React from "react";
import { Card, DatePicker, Space, Typography } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import { useTrip } from "../../context/TripContext";
import dayjs from "dayjs";

const { Text } = Typography;

export default function DateTimePicker() {
  const { state, dispatch } = useTrip();

  return (
    <Card style={{ borderRadius: 18 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Space>
          <CalendarOutlined />
          <Text strong>Ketish vaqti</Text>
        </Space>

        <DatePicker
          showTime
          value={state.dateTime ? dayjs(state.dateTime) : null}
          onChange={(v) => {
            const iso = v ? v.toISOString() : null;
            const label = v ? v.format("DD.MM, HH:mm") : "Hozir";
            dispatch({ type: "SET_DATETIME", dateTime: iso, label });
          }}
          style={{ width: "100%" }}
        />

        <Text type="secondary" style={{ fontSize: 12 }}>
          Hozirgi tanlov: <b>{state.dateTimeLabel}</b>
        </Text>
      </Space>
    </Card>
  );
}
