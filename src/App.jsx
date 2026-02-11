import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ConfigProvider } from "antd";
import { LanguageProvider } from "@shared/i18n/LanguageContext";
import RoleGate from "@shared/routes/RoleGate";

import { appConfig } from "./shared/config/appConfig";
import GaragePage from "./pages/SuperPro/GaragePage";
import PaymentsPage from "./pages/SuperPro/PaymentsPage";
import SearchOnRoutePage from "./pages/SuperPro/SearchOnRoutePage";

// --- SAHIFALAR (PAGES) ---
import Auth from "./features/auth/pages/Auth";
import Register from "./features/auth/pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import MainPage from "./pages/MainPage";
import DriverOrders from "@features/driver/pages/DriverOrders";
import DriverDashboard from "@features/driver/pages/DriverDashboard";
import DriverPending from "./pages/DriverPending";
import Logout from "./pages/Logout";
import Support from "./pages/Support";
import ClientOrders from "./pages/ClientOrders";
import MyAddresses from "./pages/MyAddresses";
import Settings from "@features/settings/pages/Settings";
import AutoMarketPage from "@features/market/pages/AutoMarketPage";
import ClientHome from "@features/client/pages/ClientHome";

// --- MIJOZ KOMPONENTLARI ---
import ClientFreight from "./features/client/components/ClientFreight";
import ClientDelivery from "./features/client/components/ClientDelivery";
import ClientInterDistrict from "./features/client/components/ClientInterDistrict";
import ClientInterProvincial from "./features/client/components/ClientInterProvincial";

// --- HAYDOVCHI MODE ---
import DriverAuth from "./features/driver/components/DriverAuth";
import DriverHome from "./features/driver/components/DriverHome";
import DriverMap from "./features/driver/components/DriverMap";
import DriverDelivery from "./features/driver/components/services/DriverDelivery";
import DriverFreight from "./features/driver/components/services/DriverFreight";
import DriverInterProvincial from "./features/driver/components/services/DriverInterProvincial";
import DriverInterDistrict from "./features/driver/components/services/DriverInterDistrict";
import DriverTaxi from "./features/driver/components/services/DriverTaxi";

import { prioritizeAssets } from "./utils/BaselineProfile";
import { ProviderSwitchPanel } from "./features/debug/components/ProviderSwitchPanel";

// Sahifalar almashganda skrolni tepaga qaytarish
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function applyNightModeClass(enabled) {
  if (enabled) document.body.classList.add("night-mode-active");
  else document.body.classList.remove("night-mode-active");
}

function safeNightModeValue(v) {
  return v === "on" || v === "off" || v === "auto" ? v : "auto";
}

export default function App() {
  // Ilova yuklanishi bilan optimizatsiyalar
  useEffect(() => {
    if (typeof prioritizeAssets === "function") {
      prioritizeAssets();
    }
  }, []);

  // Night mode state: "auto" | "on" | "off"
  const [nightMode, setNightMode] = useState("auto");

  // App start: localStorage’dan o‘qib olish
  useEffect(() => {
    const saved = safeNightModeValue(localStorage.getItem("nightMode"));
    setNightMode(saved);
  }, []);

  // URL query orqali tez boshqarish (night=1/0/auto)
  useEffect(() => {
    const qp = new URLSearchParams(window.location.search);
    const qNight = qp.get("night");

    if (qNight === "1") {
      setNightMode("on");
      localStorage.setItem("nightMode", "on");
      window.dispatchEvent(new Event("nightModeChanged"));
    } else if (qNight === "0") {
      setNightMode("off");
      localStorage.setItem("nightMode", "off");
      window.dispatchEvent(new Event("nightModeChanged"));
    } else if (qNight === "auto") {
      setNightMode("auto");
      localStorage.setItem("nightMode", "auto");
      window.dispatchEvent(new Event("nightModeChanged"));
    }
  }, []);

  // ✅ MUHIM: Settings’dan o‘zgarganda App ham darhol bilsin
  useEffect(() => {
    const syncFromStorage = () => {
      const v = safeNightModeValue(localStorage.getItem("nightMode"));
      setNightMode(v);
    };

    // boshqa tab/oynada o‘zgarsa
    const onStorage = (e) => {
      if (e.key === "nightMode") syncFromStorage();
    };

    // shu tab ichida Settings o‘zgartirganda
    const onCustom = () => {
      syncFromStorage();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("nightModeChanged", onCustom);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("nightModeChanged", onCustom);
    };
  }, []);

  // Night mode qo‘llash
  useEffect(() => {
    if (nightMode === "on") {
      applyNightModeClass(true);
      return;
    }
    if (nightMode === "off") {
      applyNightModeClass(false);
      return;
    }

    const updateAuto = () => {
      const hour = new Date().getHours();
      const enabled = hour >= 20 || hour < 6;
      applyNightModeClass(enabled);
    };

    updateAuto();
    const interval = setInterval(updateAuto, 60 * 1000);
    return () => clearInterval(interval);
  }, [nightMode]);

  const qp = new URLSearchParams(window.location.search);
  const debugProviders = qp.get("debugProviders") === "1";

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#FFD700",
          borderRadius: 12,
          fontFamily: "YangoHeadline, Inter, -apple-system, system-ui, sans-serif",
        },
        components: {
          Button: {
            controlHeightLG: 55,
            fontWeight: 800,
            borderRadiusLG: 16,
          },
          Card: {
            borderRadiusLG: 24,
            boxShadowTertiary: "0 12px 32px rgba(0,0,0,0.12)",
          },
        },
      }}
    >
      <LanguageProvider>
        <BrowserRouter>
          <ScrollToTop />
          {debugProviders && <ProviderSwitchPanel />}

          <Routes>
            {/* START */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* AUTH */}
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/logout" element={<Logout />} />

            {/* CLIENT (yo'lovchi) */}
            <Route
              path="/client"
              element={
                <RoleGate allow={{ client: true, driver: true }}>
                  <ClientHome />
                </RoleGate>
              }
            />
            <Route
              path="/client/taxi"
              element={
                <RoleGate allow={{ client: true, driver: true }}>
                  <MainPage />
                </RoleGate>
              }
            />
            <Route
              path="/client/inter-provincial"
              element={
                <RoleGate allow={{ client: true, driver: true }}>
                  <ClientInterProvincial onBack={() => window.history.back()} />
                </RoleGate>
              }
            />
            <Route
              path="/client/inter-district"
              element={
                <RoleGate allow={{ client: true, driver: true }}>
                  <ClientInterDistrict onBack={() => window.history.back()} />
                </RoleGate>
              }
            />
            <Route
              path="/client/freight"
              element={
                <RoleGate allow={{ client: true, driver: true }}>
                  <ClientFreight onBack={() => window.history.back()} />
                </RoleGate>
              }
            />
            <Route
              path="/client/delivery"
              element={
                <RoleGate allow={{ client: true, driver: true }}>
                  <ClientDelivery onBack={() => window.history.back()} />
                </RoleGate>
              }
            />

            {/* COMMON */}
            <Route
              path="/auto-market"
              element={
                <RoleGate allow={{ client: true, driver: true }}>
                  <AutoMarketPage />
                </RoleGate>
              }
            />
            <Route
              path="/settings"
              element={
                <RoleGate allow={{ client: true, driver: true }}>
                  <Settings />
                </RoleGate>
              }
            />
            <Route
              path="/addresses"
              element={
                <RoleGate allow={{ client: true, driver: true }}>
                  <MyAddresses />
                </RoleGate>
              }
            />
            <Route
              path="/orders"
              element={
                <RoleGate allow={{ client: true, driver: true }}>
                  <ClientOrders />
                </RoleGate>
              }
            />
            <Route
              path="/support"
              element={
                <RoleGate allow={{ client: true, driver: true }}>
                  <Support />
                </RoleGate>
              }
            />

            {/* DRIVER */}
            <Route
              path="/driver-mode"
              element={
                <RoleGate allow={{ client: true, driver: true }}>
                  <DriverAuth onBack={() => window.history.back()} />
                </RoleGate>
              }
            />
            <Route path="/driver-pending" element={<DriverPending />} />
            <Route
              path="/driver"
              element={
                <RoleGate allow={{ client: false, driver: true, requireDriverApproved: true }}>
                  <DriverDashboard />
                </RoleGate>
              }
            />
            <Route
              path="/driver/orders"
              element={
                <RoleGate allow={{ client: false, driver: true, requireDriverApproved: true }}>
                  <DriverOrders />
                </RoleGate>
              }
            />
            <Route
              path="/driver/taxi"
              element={
                <RoleGate allow={{ client: false, driver: true, requireDriverApproved: true }}>
                  <DriverTaxi onBack={() => window.history.back()} />
                </RoleGate>
              }
            />
            <Route
              path="/driver/inter-provincial"
              element={
                <RoleGate allow={{ client: false, driver: true, requireDriverApproved: true }}>
                  <DriverInterProvincial onBack={() => window.history.back()} />
                </RoleGate>
              }
            />
            <Route
              path="/driver/inter-district"
              element={
                <RoleGate allow={{ client: false, driver: true, requireDriverApproved: true }}>
                  <DriverInterDistrict onBack={() => window.history.back()} />
                </RoleGate>
              }
            />
            <Route
              path="/driver/freight"
              element={
                <RoleGate allow={{ client: false, driver: true, requireDriverApproved: true }}>
                  <DriverFreight onBack={() => window.history.back()} />
                </RoleGate>
              }
            />
            <Route
              path="/driver/delivery"
              element={
                <RoleGate allow={{ client: false, driver: true, requireDriverApproved: true }}>
                  <DriverDelivery onBack={() => window.history.back()} />
                </RoleGate>
              }
            />

            {/* LEGACY / SUPER PRO */}
            {appConfig.features.garage && <Route path="/garage" element={<GaragePage />} />}
            {appConfig.features.payments && <Route path="/payments" element={<PaymentsPage />} />}
            {appConfig.features.searchOnRoute && <Route path="/search-route" element={<SearchOnRoutePage />} />}

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ConfigProvider>
  );
}
