import React, { useEffect } from "react";
import { Card, Typography, Space, DatePicker, TimePicker } from "antd";
import { CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useDistrict } from "../../context/DistrictContext";

export default function DepartureTime() {
  const {
    departDate,
    setDepartDate,
    departTime,
    setDepartTime,
    setDepartureTime,
  } = useDistrict();

  // Sana va vaqt o'zgarganda umumiy 'departureTime' ni hisoblab Context'ga yozib qo'yamiz
  useEffect(() => {
    if (departDate && departTime) {
      // departDate: "YYYY-MM-DD", departTime: "HH:mm"
      const combinedString = `${departDate}T${departTime}:00`;
      const combinedDate = new Date(combinedString);
      setDepartureTime(combinedDate.toISOString());
    } else {
      setDepartureTime(null);
    }
  }, [departDate, departTime, setDepartureTime]);

  const handleDateChange = (date, dateString) => {
    setDepartDate(dateString); // "YYYY-MM-DD" formatida saqlanadi
  };

  const handleTimeChange = (time, timeString) => {
    setDepartTime(timeString); // "HH:mm" formatida saqlanadi
  };

  return (
    <Card
      bodyStyle={{ padding: "16px 12px" }}
      style={{
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        border: "none",
      }}
    >
      <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
        Ketish vaqti
      </Typography.Title>

      <Space direction="vertical" style={{ width: "100%" }} size={12}>
        {/* SANA TANLASH */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Sana
          </Typography.Text>
          <DatePicker
            style={{ width: "100%", borderRadius: 8, height: 40 }}
            placeholder="Kuni tanlang"
            format="YYYY-MM-DD"
            value={departDate ? dayjs(departDate, "YYYY-MM-DD") : null}
            onChange={handleDateChange}
            suffixIcon={<CalendarOutlined style={{ color: "#1677ff" }} />}
            disabledDate={(current) => {
              // O'tgan kunlarni tanlashni taqiqlash
              return current && current < dayjs().startOf("day");
            }}
          />
        </div>

        {/* SOAT TANLASH */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Soat
          </Typography.Text>
          <TimePicker
            style={{ width: "100%", borderRadius: 8, height: 40 }}
            placeholder="Vaqtni tanlang"
            format="HH:mm"
            value={departTime ? dayjs(departTime, "HH:mm") : null}
            onChange={handleTimeChange}
            suffixIcon={<ClockCircleOutlined style={{ color: "#1677ff" }} />}
            minuteStep={5} // Har 5 daqiqada qadamlash
          />
        </div>
      </Space>
    </Card>
  );
}