import React, { useEffect } from "react";
import { Card, DatePicker, TimePicker, Typography, Space } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useDistrict } from "../../context/DistrictContext";

/**
 * DepartureTime.jsx (Client)
 * -------------------------------------------------------
 * Ketish vaqti: Calendar (sana) + Soat (time)
 */
export default function DepartureTime() {
  const { departDate, setDepartDate, departTime, setDepartTime } = useDistrict();

  // default: bugun + 1 soat
  useEffect(() => {
    if (!departDate) setDepartDate(dayjs().format("YYYY-MM-DD"));
    if (!departTime) setDepartTime(dayjs().add(1, "hour").format("HH:mm"));
  }, [departDate, departTime, setDepartDate, setDepartTime]);

  return (
    <Card style={{ borderRadius: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <ClockCircleOutlined />
        <Typography.Text style={{ fontWeight: 700 }}>Ketish vaqti</Typography.Text>
      </div>

      <Space style={{ width: "100%" }} size={10}>
        <div style={{ flex: 1 }}>
          <Typography.Text style={{ fontSize: 12, opacity: 0.7 }}>Sana</Typography.Text>
          <DatePicker
            value={departDate ? dayjs(departDate, "YYYY-MM-DD") : null}
            onChange={(v) => setDepartDate(v ? v.format("YYYY-MM-DD") : null)}
            style={{ width: "100%", marginTop: 6 }}
            size="large"
          />
        </div>
        <div style={{ flex: 1 }}>
          <Typography.Text style={{ fontSize: 12, opacity: 0.7 }}>Soat</Typography.Text>
          <TimePicker
            value={departTime ? dayjs(departTime, "HH:mm") : null}
            onChange={(v) => setDepartTime(v ? v.format("HH:mm") : null)}
            format="HH:mm"
            style={{ width: "100%", marginTop: 6 }}
            size="large"
          />
        </div>
      </Space>
    </Card>
  );
}
