import React from "react";
import { Button, Typography } from "antd";

const { Title, Text } = Typography;

export default function RideDrawer({
  selectingFromMap,
  setSelectingFromMap,
  isSearching,
  setIsSearching,
  userAddress,
  targetAddress,
  distanceKm,
  price
}) {
  return (
    <div style={{
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 12,
      zIndex: 1002,
      background: "#fff",
      borderRadius: 16,
      padding: 12,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
    }}>
      <Title level={5} style={{ margin: 0 }}>Buyurtma</Title>

      <div style={{ marginTop: 8 }}>
        <Text type="secondary">Siz:</Text> <Text>{userAddress}</Text>
      </div>
      <div style={{ marginTop: 6 }}>
        <Text type="secondary">Manzil:</Text> <Text>{targetAddress}</Text>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Button type={selectingFromMap ? "primary" : "default"} onClick={() => setSelectingFromMap(!selectingFromMap)}>
          {selectingFromMap ? "Tanlash yakunlandi" : "Xaritadan tanlash"}
        </Button>

        <Button loading={isSearching} onClick={() => setIsSearching(!isSearching)}>
          {isSearching ? "Qidirishni to‘xtatish" : "Haydovchi qidirish"}
        </Button>
      </div>

      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
        <Text>Masofa: <b>{distanceKm} km</b></Text>
        <Text>Narx: <b>{price} so‘m</b></Text>
      </div>
    </div>
  );
}
