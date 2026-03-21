import React from "react";
import { Button, Typography } from "antd";
import { useLanguage } from "@/modules/shared/i18n/useLanguage";

const { Title, Text } = Typography;

export default function RideDrawer({
  selectingFromMap,
  setSelectingFromMap,
  isSearching,
  setIsSearching,
  userAddress,
  targetAddress,
  distanceKm,
  price,
}) {
  const { tr } = useLanguage();

  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 1002,
        background: "#fff",
        borderRadius: 16,
        padding: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
    >
      <Title level={5} style={{ margin: 0 }}>
        {tr("ride.order", "Buyurtma")}
      </Title>

      <div style={{ marginTop: 8 }}>
        <Text type="secondary">{tr("ride.you", "Siz")}:</Text> <Text>{userAddress}</Text>
      </div>
      <div style={{ marginTop: 6 }}>
        <Text type="secondary">{tr("ride.destination", "Manzil")}:</Text> <Text>{targetAddress}</Text>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Button type={selectingFromMap ? "primary" : "default"} onClick={() => setSelectingFromMap(!selectingFromMap)}>
          {selectingFromMap
            ? tr("ride.selectionDone", "Tanlash yakunlandi")
            : tr("ride.pickFromMap", "Xaritadan tanlash")}
        </Button>

        <Button loading={isSearching} onClick={() => setIsSearching(!isSearching)}>
          {isSearching
            ? tr("ride.stopSearch", "Qidirishni to‘xtatish")
            : tr("ride.searchDriver", "Haydovchi qidirish")}
        </Button>
      </div>

      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
        <Text>
          {tr("common.distance", "Masofa")}: <b>{distanceKm} km</b>
        </Text>
        <Text>
          {tr("common.price", "Narx")}: <b>{price} {tr("common.sum", "so‘m")}</b>
        </Text>
      </div>
    </div>
  );
}
