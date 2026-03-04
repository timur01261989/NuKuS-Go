import React, { useEffect, useState } from "react";
import { Drawer, Button, List, Space, Tag, Typography, message } from "antd";
import { listDriverRequests, respondTripRequest } from "@/features/shared/interDistrictTrips";

/**
 * TripRequestsDrawer.jsx (Driver)
 * -------------------------------------------------------
 * Driverga kelgan so‘rovlar (reyslar bo‘yicha).
 */
export default function TripRequestsDrawer({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listDriverRequests({ limit: 100 });
      setItems(list || []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const respond = async (id, status) => {
    const hide = message.loading("Saqlanmoqda...", 0);
    try {
      await respondTripRequest({ request_id: id, status });
      message.success("Yangilandi");
      load();
    } catch (e) {
      message.error(e?.message || "Xatolik");
    } finally {
      hide();
    }
  };

  return (
    <Drawer title="So‘rovlar" placement="right" width={420} open={open} onClose={onClose}>
      <Button onClick={load} style={{ width: "100%", borderRadius: 14 }}>
        Yangilash
      </Button>

      <List
        loading={loading}
        dataSource={items}
        style={{ marginTop: 12 }}
        renderItem={(r) => (
          <List.Item>
            <div style={{ width: "100%" }}>
              <Space style={{ width: "100%", justifyContent: "space-between" }} align="start">
                <div>
                  <Typography.Text style={{ fontWeight: 800 }}>{r.status}</Typography.Text>
                  <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                  {r.pickup_address && <div style={{ fontSize: 12, marginTop: 6 }}>📍 {r.pickup_address}</div>}
                  {r.dropoff_address && <div style={{ fontSize: 12, marginTop: 4 }}>🏁 {r.dropoff_address}</div>}
                  {r.wants_full_salon && <Tag color="gold" style={{ marginTop: 6 }}>Butun salon</Tag>}
                  {r.is_delivery && <Tag style={{ marginTop: 6 }}>📦 Eltish</Tag>}
                </div>

                <Space direction="vertical">
                  <Button type="primary" onClick={() => respond(r.id, "accepted")}>
                    Qabul
                  </Button>
                  <Button danger onClick={() => respond(r.id, "rejected")}>
                    Rad
                  </Button>
                </Space>
              </Space>
            </div>
          </List.Item>
        )}
      />
    </Drawer>
  );
}
