import React from "react";
import { Card, Steps } from "antd";
import { useClientText } from "../../shared/i18n_clientLocalize";
import { orderAssets } from "@/assets/order";
import { realtimeAssets } from "@/assets/realtime";
import { assetStyles } from "@/assets/assetPolish";

export default function StatusTimeline({ status }) {
  const { cp } = useClientText();
  const items = [
    { key: "searching", title: cp("Qidirilmoqda"), icon: realtimeAssets.status.statusTimeWatchLarge || realtimeAssets.status.statusScheduleQuick || orderAssets.orderWatchLarge || orderAssets.orderSchedule },
    { key: "pickup", title: cp("Oldi"), icon: realtimeAssets.navigation.trackingProgressPin || orderAssets.orderProgressPin || orderAssets.orderBoxPoint },
    { key: "delivering", title: cp("Yo‘lda"), icon: realtimeAssets.navigation.trackingRouteOutline || orderAssets.courierDeliCar || orderAssets.courierDefaultCar },
    { key: "completed", title: cp("Topshirdi"), icon: realtimeAssets.status.statusScheduleCheck || orderAssets.orderCheckFillYellow || orderAssets.orderCheck },
  ];
  const idx = Math.max(0, items.findIndex((x) => x.key === status));
  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 1000, marginBottom: 10 }}>{cp("Holat")}</div>
      <Steps
        size="small"
        current={idx}
        items={items.map((x) => ({ title: x.title, icon: <img src={x.icon} alt="" style={assetStyles.timelineIcon} /> }))}
      />
    </Card>
  );
}
