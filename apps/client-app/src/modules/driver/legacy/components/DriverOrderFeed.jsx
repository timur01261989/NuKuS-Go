import React from "react";
import {
  CarOutlined,
  GlobalOutlined,
  RocketOutlined,
  ShopOutlined,
} from "@ant-design/icons";

import DriverTaxi from "./services/DriverTaxi";
import DriverInterDistrict from "./services/DriverInterDistrict";
import DriverInterProvincial from "./services/DriverInterProvincial";
import DriverFreight from "./services/DriverFreight";
import DriverDelivery from "./services/DriverDelivery";

import {
  DriverOrderFeedHeader,
  DriverOrderFeedStats,
  DriverOrderFeedNotice,
  DriverOrderFeedServices,
  DriverOrderFeedProfileDrawer,
} from "./driverOrderFeed.helpers.jsx";
import { useDriverOrderFeedController } from "./useDriverOrderFeedController.js";

export default function DriverOrderFeed({ onLogout }) {
  const {
    selectedService,
    setSelectedService,
    profileOpen,
    setProfileOpen,
    isOnline,
    loading,
    stats,
    drawerInnerRef,
    toggleDarkMode,
    toggleOnline,
  } = useDriverOrderFeedController();

  const onProfileTouchStart = () => {};
  const onProfileTouchMove = () => {};
  const onProfileTouchEnd = () => {};

  if (selectedService === "taxi") return <DriverTaxi onBack={() => setSelectedService(null)} />;
  if (selectedService === "inter_district") return <DriverInterDistrict onBack={() => setSelectedService(null)} />;
  if (selectedService === "inter_provincial") return <DriverInterProvincial onBack={() => setSelectedService(null)} />;
  if (selectedService === "freight") return <DriverFreight onBack={() => setSelectedService(null)} />;
  if (selectedService === "delivery") return <DriverDelivery onBack={() => setSelectedService(null)} />;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", paddingBottom: 40, fontFamily: "sans-serif" }}>
      <DriverOrderFeedHeader
        isOnline={isOnline}
        toggleDarkMode={toggleDarkMode}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <div style={{ padding: "20px 15px" }}>
        <DriverOrderFeedStats stats={stats} />
        <DriverOrderFeedNotice />
        <DriverOrderFeedServices
          setSelectedService={setSelectedService}
          CarOutlined={CarOutlined}
          GlobalOutlined={GlobalOutlined}
          ShopOutlined={ShopOutlined}
          RocketOutlined={RocketOutlined}
        />
      </div>

      <DriverOrderFeedProfileDrawer
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        drawerInnerRef={drawerInnerRef}
        onProfileTouchStart={onProfileTouchStart}
        onProfileTouchMove={onProfileTouchMove}
        onProfileTouchEnd={onProfileTouchEnd}
        isOnline={isOnline}
        loading={loading}
        toggleOnline={toggleOnline}
        onLogout={onLogout}
      />
    </div>
  );
}
