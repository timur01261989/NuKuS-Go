import React, { useMemo, useState } from "react";
import { Button, Card, Space, Tag, Typography, message } from "antd";
import { SendOutlined, CloudUploadOutlined } from "@ant-design/icons";
import { useTrip } from "../../context/TripContext";
import { interProvincialApi } from "../../services/interProvincialApi";
import { buildTripShareText, openTelegramShare } from "../../services/telegramShare";
import { TRIP_STATUS } from "../../context/tripReducer";

const { Text } = Typography;

export default function TripStatusPanel() {
  const { state, dispatch } = useTrip();
  const [publishing, setPublishing] = useState(false);

  const canPublish = state.status === TRIP_STATUS.DRAFT;

  const publish = async () => {
    setPublishing(true);
    try {
      const payload = {
        route: state.route,
        date_time: state.dateTime,
        dateTimeLabel: state.dateTimeLabel,
        seats: state.seats,
        female_mode: state.femaleMode,
        amenities: state.amenities,
        car_plate: state.carPlate,
      };
      const r = await interProvincialApi.createTrip(payload);
      const tripId = r?.data?.id || r?.id || r?.tripId;
      if (!tripId) throw new Error("Trip ID kelmadi");

      dispatch({ type: "SET_TRIP_ID", tripId: String(tripId) });
      dispatch({ type: "SET_STATUS", status: TRIP_STATUS.COLLECTING });

      const deep = `${window.location.origin}/client/inter-provincial/${tripId}`;
      dispatch({ type: "SET_DEEPLINK", url: deep });

      message.success("Reys yaratildi");
    } catch (e) {
      console.error(e);
      message.error("Reys yaratishda xatolik: " + (e?.message || ""));
    } finally {
      setPublishing(false);
    }
  };

  const shareText = useMemo(() => buildTripShareText({ ...state, deepLink: state.deepLink }), [state]);

  return (
    <Card style={{ borderRadius: 18 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text strong>Reys holati</Text>
          <Tag color={state.status === TRIP_STATUS.DRAFT ? "default" : "green"}>{state.status}</Tag>
        </Space>

        <Space wrap>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={publish}
            loading={publishing}
            disabled={!canPublish}
          >
            Reysni e'lon qilish
          </Button>

          <Button
            icon={<SendOutlined />}
            disabled={!state.tripId}
            onClick={() => openTelegramShare({ url: state.deepLink || "", text: shareText })}
          >
            Telegramda ulashish
          </Button>
        </Space>

        {!state.tripId ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Telegram ulashish uchun avval reysni e'lon qiling.
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Deep link: <b>{state.deepLink}</b>
          </Text>
        )}
      </Space>
    </Card>
  );
}
