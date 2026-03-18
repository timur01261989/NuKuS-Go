import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { appConfig } from "../../../shared/config/appConfig";

import DriverTaxi from "./services/DriverTaxi";
import DriverInterDistrict from "./services/DriverInterDistrict";
import DriverInterProvincial from "./services/DriverInterProvincial";
import DriverFreight from "./services/DriverFreight";
import DriverDelivery from "./services/DriverDelivery";

import DriverSidebar from "./DriverSidebar";
import RadarMiniOverlay from "./RadarMiniOverlay";
import { useLanguage } from "@/modules/shared/i18n/useLanguage";
import {
  DriverBottomNav,
  DriverHomeTopBar,
  DriverProfileDrawer,
  DriverServiceErrorBoundary,
  DriverServiceMenu,
  DriverStatusCard,
  DriverVehicleCard,
} from "./driverHome.sections.jsx";
import { useDriverHomeController } from "./useDriverHomeController.js";

export default function DriverHome({ onLogout }) {
  const navigate = useNavigate();
  const { t, tr } = useLanguage("driver");
  const {
    isOnline,
    selectedService,
    sidebarOpen,
    setSidebarOpen,
    profileOpen,
    setProfileOpen,
    loading,
    driverHeader,
    driveAssistantEnabled,
    speedKmh,
    nearestRadar,
    radarSeverity,
    backToMenu,
    selectService,
    toggleOnline,
    drawerInnerRef,
    onProfileTouchStart,
    onProfileTouchMove,
    onProfileTouchEnd,
    serviceCards,
    driverStatusLabel,
    activeVehicleSummary,
  } = useDriverHomeController({ tr, t });

  const content = useMemo(() => {
    if (selectedService === "taxi") return <DriverTaxi onBack={backToMenu} />;
    if (selectedService === "interDist") return <DriverInterDistrict onBack={backToMenu} />;
    if (selectedService === "interProv") return <DriverInterProvincial onBack={backToMenu} />;
    if (selectedService === "freight") return <DriverFreight onBack={backToMenu} />;
    if (selectedService === "delivery") return <DriverDelivery onBack={backToMenu} />;
    return null;
  }, [selectedService, backToMenu]);

  const serviceContent = useMemo(() => {
    if (!content) return null;
    return (
      <DriverServiceErrorBoundary resetKey={selectedService} onBack={backToMenu}>
        {content}
      </DriverServiceErrorBoundary>
    );
  }, [content, selectedService, backToMenu]);

  const menuUi = (
    <div className="min-h-screen bg-backgroundLightDriver font-display text-slate-900">
      <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={onLogout} />

      <div className="flex items-center justify-between p-4 bg-transparent">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl neumorphic-pop text-slate-700"
            aria-label={t.menu || "Menyu"}
          >
            <span className="material-symbols-outlined block">menu</span>
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-primarySidebar">{tr("appName", appConfig.name || "UniGo")}</h1>
        </div>
      </div>

      <DriverHomeTopBar
        onOpenSidebar={() => setSidebarOpen(true)}
        driverHeader={driverHeader}
        tr={tr}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <DriverStatusCard
        isOnline={isOnline}
        activeServiceLabel={driverStatusLabel}
        loading={loading}
        onToggle={toggleOnline}
        tr={tr}
      />

      <DriverVehicleCard
        summary={activeVehicleSummary}
        onOpenVehicles={() => navigate("/driver/settings?tab=vehicles")}
      />

      <DriverServiceMenu
        cards={serviceCards}
        onSelectService={selectService}
        emptyText={"Sozlamalarda kamida bitta xizmatni yoqing. Aktiv mashina bo'lmasa buyurtmalar chiqmaydi."}
      />

      <DriverBottomNav
        tr={tr}
        onHome={() => { backToMenu(); navigate("/driver"); }}
        onOrders={() => navigate("/driver/orders")}
        onSettings={() => navigate("/driver/settings")}
      />

      <DriverProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        drawerInnerRef={drawerInnerRef}
        onTouchStart={onProfileTouchStart}
        onTouchMove={onProfileTouchMove}
        onTouchEnd={onProfileTouchEnd}
        isOnline={isOnline}
        loading={loading}
        onToggle={toggleOnline}
        onLogout={onLogout}
        tr={tr}
      />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      {serviceContent || menuUi}
      {!profileOpen ? (
        <RadarMiniOverlay online={driveAssistantEnabled} speedKmh={speedKmh} radar={nearestRadar} severity={radarSeverity} />
      ) : null}
    </div>
  );
}
