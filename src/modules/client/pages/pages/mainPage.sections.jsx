import React from "react";
import { Button, Divider, Drawer, Typography } from "antd";
import { CustomerServiceOutlined, EnvironmentOutlined, HistoryOutlined, LogoutOutlined, MenuOutlined, SettingOutlined } from "@ant-design/icons";
import { profileAssets } from "@/assets/profile";
import { searchAssets } from "@/assets/search";
import { assetStyles } from "@/assets/assetPolish";

const { Title, Text } = Typography;

export const mainPageStyles = {
  container: {
    width: "100vw",
    height: "100vh",
    position: "fixed",
    inset: 0,
    overflow: "hidden",
    background: "#f0f0f0",
  },
  menuButton: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 1006,
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    border: "1px solid rgba(0,0,0,0.06)",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 72,
    zIndex: 1005,
    borderRadius: 14,
  },
  infoCard: {
    position: "absolute",
    top: 16,
    left: 110,
    right: 16,
    zIndex: 1004,
    background: "#fff",
    borderRadius: 16,
    padding: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
    overflow: "hidden",
  },
  bottomSheet: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 1006,
    background: "#fff",
    borderRadius: 20,
    padding: 12,
    boxShadow: "0 12px 32px rgba(0,0,0,0.14)",
  },
};

export function MainMenuButton({ onClick }) {
  return (
    <Button
      type="text"
      aria-label="Menu"
      onClick={onClick}
      icon={<MenuOutlined style={{ fontSize: 20 }} />}
      style={mainPageStyles.menuButton}
    />
  );
}

export function MainSideMenu({ open, onClose, navigate, t, tx }) {
  const menuButtons = [
    {
      key: "driver-mode",
      icon: <img src={profileAssets.icons.login} alt="" style={assetStyles.serviceMiniIcon} />,
      label: tx("workAsDriver", "Haydovchi bo‘lib ishlash"),
      onClick: () => navigate("/driver-mode"),
    },
    {
      key: "addresses",
      icon: <img src={searchAssets.homeAlt || searchAssets.home} alt="" style={assetStyles.serviceMiniIcon} />,
      label: t.myAddresses || tx("myAddressesLabel", "Mening manzillarim"),
      onClick: () => navigate("/addresses"),
    },
    {
      key: "settings",
      icon: <img src={profileAssets.icons.business} alt="" style={assetStyles.serviceMiniIcon} />,
      label: t.settings || tx("settingsLabel", "Sozlamalar"),
      onClick: () => navigate("/settings"),
    },
    {
      key: "orders",
      icon: <img src={profileAssets.icons.clock} alt="" style={assetStyles.serviceMiniIcon} />,
      label: tx("ordersHistoryTitle", "Buyurtmalar tarixi"),
      onClick: () => navigate("/orders"),
    },
  ];

  return (
    <Drawer placement="left" open={open} onClose={onClose} width={300} bodyStyle={{ padding: 12 }}>
      <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>{t.menu || tx("menu", "Menu")}</div>
      <Divider style={{ margin: "10px 0" }} />
      {menuButtons.map((item, index) => (
        <Button
          key={item.key}
          block
          icon={item.icon}
          style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: index === 0 ? 0 : 8 }}
          onClick={() => {
            onClose();
            item.onClick();
          }}
        >
          {item.label}
        </Button>
      ))}
      <div style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
        <Button
          block
          icon={<CustomerServiceOutlined />}
          style={{ height: 44, borderRadius: 12, textAlign: "left" }}
          onClick={() => {
            onClose();
            navigate("/support");
          }}
        >
          {tx("supportSection", "Qo‘llab-quvvatlash")}
        </Button>
        <Button
          danger
          block
          icon={<LogoutOutlined />}
          style={{ height: 44, borderRadius: 12, textAlign: "left", marginTop: 8 }}
          onClick={() => {
            onClose();
            navigate("/logout");
          }}
        >
          {t.logout || tx("logout", "Chiqish")}
        </Button>
      </div>
    </Drawer>
  );
}

export function MainTopInfoCard({ tx, userAddress, targetAddress, selectingFromMap, isMoving }) {
  return (
    <div style={mainPageStyles.infoCard}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div>
          <Text type="secondary">{tx("youLabel", "Siz")}:</Text>{" "}
          <Text style={{ lineHeight: 1.2 }}>{userAddress}</Text>
        </div>
        <div>
          <Text type="secondary">{tx("addressLabel", "Manzil")}:</Text>{" "}
          <Text style={{ lineHeight: 1.2 }}>{targetAddress}</Text>
        </div>
        {selectingFromMap ? (
          <Text type="secondary">
            {isMoving
              ? tx("dragMapRelease", "Xaritani qo‘yib yuboring — manzil olinadi...")
              : tx("dragMapMove", "Xaritani suring — markaz manzil bo‘ladi")}
          </Text>
        ) : null}
      </div>
    </div>
  );
}

export function MainBottomSheet({
  tx,
  selectingFromMap,
  toggleSelecting,
  isSearching,
  toggleSearch,
  distanceKm,
  priceUzs,
  showPricing,
  setShowPricing,
  targetLoc,
  userLoc,
  distanceMeters,
  userAddress,
  targetAddress,
}) {
  return (
    <div style={mainPageStyles.bottomSheet}>
      <Title level={5} style={{ margin: 0 }}>
        {tx("taxiOrderTitle", "Taxi buyurtma")}
      </Title>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Button type={selectingFromMap ? "primary" : "default"} onClick={toggleSelecting} style={{ flex: 1, borderRadius: 14 }}>
          {selectingFromMap ? tx("finishSelection", "Tanlash yakunlandi") : tx("pickOnMap", "Xaritadan tanlash")}
        </Button>
        <Button loading={isSearching} onClick={toggleSearch} style={{ flex: 1, borderRadius: 14 }}>
          {isSearching ? tx("stopSearch", "Qidirishni to‘xtatish") : tx("searchDriver", "Haydovchi qidirish")}
        </Button>
      </div>
      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 10 }}>
        <Text>{tx("distance", "Masofa")}: <b>{distanceKm} km</b></Text>
        <Text>{tx("price", "Narx")}: <b>{priceUzs.toLocaleString("ru-RU")} {tx("som", "so‘m")}</b></Text>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Button onClick={() => setShowPricing((v) => !v)} style={{ flex: 1, borderRadius: 14 }}>
          {showPricing ? tx("hideRoute", "Route yashirish") : tx("showRoute", "Route ko‘rsatish")}
        </Button>
        <Button
          type="primary"
          style={{ flex: 1, borderRadius: 14 }}
          disabled={!targetLoc?.length}
          onClick={() => {
            console.log("ORDER DATA:", {
              from: userLoc,
              to: targetLoc,
              price_uzs: priceUzs,
              distance_meters: distanceMeters,
              pickup: userAddress,
              dropoff: targetAddress,
            });
          }}
        >
          {tx("placeOrder", "Buyurtma berish")}
        </Button>
      </div>
    </div>
  );
}
