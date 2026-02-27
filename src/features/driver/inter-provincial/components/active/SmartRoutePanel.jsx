import React, { useEffect, useMemo, useState } from "react";
import { Card, List, Space, Tag, Typography } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useTrip } from "../../context/TripContext";
import { useSmartSort } from "../../hooks/useSmartSort";

const { Text } = Typography;

export default function SmartRoutePanel({ origin }) {
  const { state } = useTrip();
  const smartSort = useSmartSort();
  const [sorted, setSorted] = useState([]);

  const points = useMemo(() => {
    const pass = (state.passengerManifest || []).map((p) => ({
      id: p.id,
      type: "passenger",
      title: p.name,
      subtitle: p.address || "",
      latlng: p.latlng,
    }));
    const parcels = (state.parcels || []).map((p) => ({
      id: p.id,
      type: "parcel",
      title: `📦 ${p.title}`,
      subtitle: p.receiverPhone || "",
      latlng: p.latlng,
    }));
    return [...pass, ...parcels].filter((x) => x.latlng);
  }, [state.passengerManifest, state.parcels]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await smartSort(origin, points);
      if (mounted) setSorted(s);
    })();
    return () => {
      mounted = false;
    };
  }, [origin, points, smartSort]);

  return (
    <Card style={{ borderRadius: 18 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Space>
          <EnvironmentOutlined />
          <Text strong>🧠 Aqlli marshrut</Text>
        </Space>

        {sorted.length === 0 ? (
          <Text type="secondary">Hozircha manzilli yo'lovchi/posilka yo'q</Text>
        ) : (
          <List
            dataSource={sorted}
            renderItem={(x, idx) => (
              <List.Item>
                <Space direction="vertical" size={2} style={{ width: "100%" }}>
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Text strong>
                      {idx + 1}. {x.title}
                    </Text>
                    <Tag color={x.type === "parcel" ? "gold" : "blue"}>{x.type}</Tag>
                  </Space>
                  <Text type="secondary">{x.subtitle}</Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Space>
    </Card>
  );
}
