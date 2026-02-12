import React, { useEffect, useState } from "react";
import { Card, Typography, Tag } from "antd";
import { supabase } from "@lib/supabase"; // Yoki to'g'ri modelingizdagi yo'l

const { Title, Text } = Typography;

export default function DriverOrders() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadOrders = async () => {
      try {
        const { data: u, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("getUser error:", userError);
          return;
        }

        const uid = u?.user?.id;
        if (!uid) return;

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("driver_id", uid)
          .neq("status", "cancelled") // ✅ MANA SHU QATOR QO'SHILDI (Bekor qilinganlarni olib tashlaydi)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) {
          console.error("orders error:", error);
          return;
        }

        if (mounted) setItems(data || []);
      } catch (e) {
        console.error("DriverOrders load error:", e);
      }
    };

    loadOrders();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ padding: 14, maxWidth: 860, margin: "0 auto" }}>
      <Title level={3} style={{ marginTop: 6 }}>
        Buyurtmalar tarixi
      </Title>

      {!items.length ? (
        <Text type="secondary">Hozircha buyurtmalar yo‘q.</Text>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        {items.map((o) => (
          <Card key={o.id} style={{ borderRadius: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <Text strong>{o.service_type || "service"}</Text>
              <Tag color={o.status === "completed" ? "green" : "blue"}>
                {o.status || "?"}
              </Tag>
            </div>

            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ display: "block" }}>
                {o.pickup_location || "Manzil noma'lum"}
              </Text>
              
              {/* Agar dropoff_location mavjud bo'lsa ko'rsatish */}
              {o.dropoff_location && (
                <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
                   → {o.dropoff_location}
                </Text>
              )}

              {o.price && (
                <Text strong style={{ display: "block", marginTop: 8, fontSize: 16 }}>
                  {parseInt(o.price).toLocaleString()} so'm
                </Text>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}