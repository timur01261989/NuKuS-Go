import React, { useEffect, useState } from "react";
import { Button, Drawer, List, Tag, message } from "antd";
import { supabase } from "@/lib/supabase";
import { listTripRequestsForDriver, respondTripRequest } from "@/features/shared/interDistrictTrips";

function statusTag(s) {
  const map = {
    sent: <Tag color="blue">Yangi</Tag>,
    accepted: <Tag color="green">Qabul</Tag>,
    declined: <Tag color="red">Rad</Tag>,
    canceled: <Tag>Bekor</Tag>,
  };
  return map[s] || <Tag>{String(s || "")}</Tag>;
}

export default function TripRequestsDrawer({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) throw new Error("Login bo‘ling");
      const { data, error } = await listTripRequestsForDriver({ driver_id: uid });
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      message.error(e?.message || "So‘rovlarni olishda xato");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    refresh();
  }, [open]);

  const act = async (id, status) => {
    setLoading(true);
    try {
      const { error } = await respondTripRequest({ request_id: id, status });
      if (error) throw error;
      message.success(status === "accepted" ? "Qabul qilindi" : "Rad etildi");
      await refresh();
    } catch (e) {
      message.error(e?.message || "Xato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Reys so‘rovlari" width={520}>
      <div style={{ marginBottom: 12 }}>
        <Button onClick={refresh} loading={loading}>Yangilash</Button>
      </div>

      <List
        loading={loading}
        dataSource={rows}
        renderItem={(r) => (
          <List.Item
            actions={[
              r.status === "sent" ? (
                <>
                  <Button key="acc" type="primary" onClick={() => act(r.id, "accepted")}>Qabul</Button>
                  <Button key="dec" danger onClick={() => act(r.id, "declined")}>Rad</Button>
                </>
              ) : null,
            ]}
          >
            <List.Item.Meta
              title={
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {statusTag(r.status)}
                  <span>{r.client_name || "Mijoz"}</span>
                </div>
              }
              description={
                <div style={{ fontSize: 12, opacity: 0.9 }}>
                  <div>Tel: {r.client_phone || "—"}</div>
                  <div>Seats: {r.seats}{r.wants_full_salon ? " (Polni salon)" : ""}</div>
                  {r.pickup_address ? <div>Pickup: {r.pickup_address}</div> : null}
                  {r.dropoff_address ? <div>Dropoff: {r.dropoff_address}</div> : null}
                  {r.note ? <div>Izoh: {r.note}</div> : null}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Drawer>
  );
}
