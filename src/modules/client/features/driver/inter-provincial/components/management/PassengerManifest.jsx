import React from "react";
import { Card, List, Space, Tag, Typography } from "antd";
import { PhoneOutlined, UserOutlined } from "@ant-design/icons";
import { useTrip } from "../../context/TripContext";

const { Text } = Typography;

export default function PassengerManifest() {
  const { state } = useTrip();

  return (
    <Card style={{ borderRadius: 18 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Text strong>📋 Yo'lovchilar ro'yxati</Text>

        {state.passengerManifest.length === 0 ? (
          <Text type="secondary">Hozircha yo'lovchi yo'q</Text>
        ) : (
          <List
            dataSource={state.passengerManifest}
            renderItem={(p) => (
              <List.Item>
                <Space direction="vertical" size={2} style={{ width: "100%" }}>
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Space>
                      <UserOutlined />
                      <Text strong>{p.name}</Text>
                    </Space>
                    <Tag>{p.seats || 1} joy</Tag>
                  </Space>
                  <Space>
                    <PhoneOutlined />
                    <Text type="secondary">{p.phone}</Text>
                  </Space>
                  {p.address ? <Text type="secondary">{p.address}</Text> : null}
                </Space>
              </List.Item>
            )}
          />
        )}
      </Space>
    </Card>
  );
}
