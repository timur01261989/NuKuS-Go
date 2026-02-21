import React, { useMemo, useState } from "react";
import { Button, Modal, Space, Typography, message } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useTrip } from "../../context/TripContext";
import { interProvincialApi } from "../../services/interProvincialApi";

const { Text } = Typography;

export default function SeatRequestModal() {
  const { state, dispatch } = useTrip();
  const [loading, setLoading] = useState(false);

  const nextReq = useMemo(() => state.seatRequests?.find((r) => r.status === "pending") || state.seatRequests?.[0], [state.seatRequests]);

  const close = () => {
    if (!nextReq) return;
    dispatch({ type: "REMOVE_SEAT_REQUEST", requestId: nextReq.id });
  };

  const respond = async (accept) => {
    if (!nextReq) return;
    setLoading(true);
    try {
      await interProvincialApi.respondSeatRequest({ requestId: nextReq.id, accept });
      if (accept) {
        dispatch({
          type: "ADD_PASSENGER",
          passenger: {
            id: nextReq.id,
            name: nextReq.client_name || "Mijoz",
            phone: nextReq.client_phone || "-",
            seats: nextReq.seats || 1,
            address: nextReq.pickup_address || "",
          },
        });
        message.success("So'rov qabul qilindi");
      } else {
        message.info("So'rov rad etildi");
      }
      close();
    } catch (e) {
      message.error("Javob berishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={!!nextReq} onCancel={close} footer={null} centered title="💺 Joy so'rovi">
      {!nextReq ? null : (
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <Text>
            <b>{nextReq.client_name || "Mijoz"}</b> {nextReq.seats ? `(${nextReq.seats} joy)` : ""}
          </Text>
          {nextReq.pickup_address ? <Text type="secondary">{nextReq.pickup_address}</Text> : null}

          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button icon={<CloseOutlined />} onClick={() => respond(false)} loading={loading}>
              Rad etish
            </Button>
            <Button type="primary" icon={<CheckOutlined />} onClick={() => respond(true)} loading={loading}>
              Qabul qilish
            </Button>
          </Space>
        </Space>
      )}
    </Modal>
  );
}
