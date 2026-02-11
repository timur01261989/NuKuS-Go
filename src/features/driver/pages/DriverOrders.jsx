import React, { useEffect, useState } from "react";
import { Card, Typography, Tag } from "antd";
import { supabase } from "@lib/supabase";

const { Title, Text } = Typography;

export default function DriverOrders() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("driver_id", uid)
        .order("created_at", { ascending: false })
        .limit(100);
      if (mounted) setItems(data || []);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ padding: 14, maxWidth: 860, margin: "0 auto" }}>
      <Title level={3} style={{ marginTop: 6 }}>Buyurtmalar tarixi</Title>
      {!items.length ? <Text type="secondary">Hozircha buyurtmalar yo‘q.</Text> : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginTop: 12 }}>
        {items.map((o) => (
          <Card key={o.id} style={{ borderRadius: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <Text strong>{o.service_type || "service"}</Text>
              <Tag>{o.status || "?"}</Tag>
            </div>
            <Text type="secondary">{o.pickup_location || ""}</Text><br/>
            <Text type="secondary">{o.dropoff_location || ""}</Text><br/>
            <Text strong>{o.price ? `${o.price} UZS` : ""}</Text>
          </Card>
        ))}
      </div>
    </div>
  );
}
