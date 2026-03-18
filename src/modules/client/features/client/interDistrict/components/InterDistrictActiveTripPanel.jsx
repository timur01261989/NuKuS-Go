import React from "react";
import { Alert, Button, Card, Divider, message, Popconfirm, Steps, Tag, Typography } from "antd";
import { cancelTripRequest } from "@/modules/client/features/shared/interDistrictTrips.js";
import { useDistrict } from "../context/DistrictContext";
import { INTERDISTRICT_TRIP_STATUS, mapTripStatusToClientStep } from "@/modules/shared/interdistrict/domain/interDistrictStatuses";
import { buildClientTripTimeline, buildClientTripSignals } from "@/modules/shared/interdistrict/domain/interDistrictSignals";

export default function InterDistrictActiveTripPanel() {
  const {
    tripStatus,
    setTripStatus,
    activeDriver,
    activeTripRequest,
    setActiveTripRequest,
    setCanonicalTripStatus,
    canonicalTripStatus,
    routeInfo,
  } = useDistrict();

  const timeline = buildClientTripTimeline(canonicalTripStatus || activeTripRequest?.status, activeTripRequest);
  const currentIndex = Math.max(0, timeline.findIndex((item) => item.active));
  const signals = buildClientTripSignals({ activeTripRequest, routeInfo, canonicalStatus: canonicalTripStatus });

  const handleCancel = async () => {
    if (!activeTripRequest?.id) {
      setTripStatus(mapTripStatusToClientStep(INTERDISTRICT_TRIP_STATUS.CANCELED));
      setCanonicalTripStatus?.(INTERDISTRICT_TRIP_STATUS.CANCELED);
      return;
    }
    message.loading({ content: "Bekor qilinmoqda...", key: "cancel-trip" });
    try {
      await cancelTripRequest({ request_id: activeTripRequest.id, reason: "client_cancelled_from_panel" });
      setActiveTripRequest?.(null);
      setCanonicalTripStatus?.(INTERDISTRICT_TRIP_STATUS.CANCELED);
      setTripStatus(mapTripStatusToClientStep(INTERDISTRICT_TRIP_STATUS.CANCELED));
      message.warning({ content: "Safar bekor qilindi", key: "cancel-trip", duration: 3 });
    } catch (error) {
      message.error({ content: error?.message || "Safarni bekor qilib bo‘lmadi", key: "cancel-trip", duration: 4 });
    }
  };

  return (
    <Card style={{ borderRadius: 18, marginTop: 12, border: "2px solid #1677ff", boxShadow: "0 4px 12px rgba(22, 119, 255, 0.15)" }} styles={{ body: { padding: 16 } }}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>Aktiv Safar</Typography.Title>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <Typography.Text type="secondary">Holat</Typography.Text>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{tripStatus}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Tag color={signals.statusTone === 'success' ? 'green' : signals.statusTone === 'processing' ? 'blue' : signals.statusTone === 'error' ? 'red' : 'default'}>
            {signals.distanceLabel}
          </Tag>
          <Tag color="purple">{signals.durationLabel}</Tag>
          <Tag color={signals.seatCount ? 'green' : 'default'}>Joy: {signals.seatCount || 0}</Tag>
        </div>
      </div>

      <Divider />

      <Steps
        size="small"
        current={currentIndex}
        items={timeline.map((item) => ({
          title: item.label,
          description: item.at ? new Date(item.at).toLocaleString("uz-UZ") : undefined,
          status: item.done ? "finish" : item.active ? "process" : "wait",
        }))}
      />

      {canonicalTripStatus === INTERDISTRICT_TRIP_STATUS.MATCHED ? (
        <Alert
          style={{ marginTop: 14, borderRadius: 14 }}
          type="info"
          showIcon
          message="Haydovchi kutilmoqda"
          description="So‘rovingiz qabul navbatida. Driver tasdig‘i kelgach status avtomatik yangilanadi."
        />
      ) : null}

      {activeDriver ? (
        <>
          <Divider />
          <Typography.Text strong>Haydovchi</Typography.Text>
          <div style={{ marginTop: 8 }}>
            <div><b>{activeDriver.name}</b> · {activeDriver.rating}</div>
            <div>{activeDriver.car} · {activeDriver.carNumber}</div>
            {activeDriver.phone ? <div>{activeDriver.phone}</div> : null}
          </div>
        </>
      ) : null}

      <Divider />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Typography.Text type="secondary">
          Server source-of-truth bilan tiklandi va timeline holatlari canonical statusga mos yuritiladi.
        </Typography.Text>
        <Popconfirm
          title="Safarni bekor qilasizmi?"
          description="Bekor qilishdan keyin qayta so‘rov yuborishingiz kerak bo‘ladi."
          onConfirm={handleCancel}
          okText="Ha"
          cancelText="Yo‘q"
        >
          <Button danger disabled={!signals.cancelable}>Bekor qilish</Button>
        </Popconfirm>
      </div>
    </Card>
  );
}
