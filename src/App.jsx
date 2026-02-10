import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ConfigProvider } from "antd";

import { appConfig } from "./shared/config/appConfig";
import GaragePage from "./pages/SuperPro/GaragePage";
import PaymentsPage from "./pages/SuperPro/PaymentsPage";
import SearchOnRoutePage from "./pages/SuperPro/SearchOnRoutePage";

// --- SAHIFALAR (PAGES) ---
import Login from "./pages/Auth";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import MainPage from "./pages/MainPage";

// --- MIJOZ KOMPONENTLARI ---
import ClientFreight from "./features/client/components/ClientFreight";
import ClientInterDistrict from "./features/client/components/ClientInterDistrict";

// --- HAYDOVCHI MODE ---
import DriverAuth from "./features/driver/components/DriverAuth";
import DriverHome from "./features/driver/components/DriverHome";
import DriverMap from "./features/driver/components/DriverMap";

import { prioritizeAssets } from "./utils/BaselineProfile";

// Debug komponentlar (named exports)
import { OrderRealtimeDebug } from "./features/taxi/components/OrderRealtimeDebug";
import { ProviderSwitchPanel } from "./features/debug/components/ProviderSwitchPanel";

// Sahifalar almashganda skrolni tepaga qaytarish
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

/**
 * Night mode boshqaruvi:
 * - default: AUTO (20:00-06:00)
 * - manual ON/OFF: localStorage orqali saqlanadi
 * - URL orqali tez yoqish/o‘chirish:
 *    ?night=1  -> majburan yoqadi (manual)
 *    ?night=0  -> majburan o‘chiradi (manual)
 *    ?night=auto -> manualni tozalaydi, auto rejimga qaytadi
 */
function applyNightModeClass(enabled) {
  if (enabled) document.body.classList.add("night-mode-active");
  else document.body.classList.remove("night-mode-active");
}

export default function App() {
  // Ilova yuklanishi bilan optimizatsiyalar
  useEffect(() => {
    prioritizeAssets();
  }, []);

  // Night mode state:
  // mode: "auto" | "on" | "off"
  const [nightMode, setNightMode] = useState("auto");

  // App start: localStorage’dan o‘qib olish
  useEffect(() => {
    const saved = localStorage.getItem("nightMode"); // "auto" | "on" | "off" | null
    if (saved === "on" || saved === "off" || saved === "auto") {
      setNightMode(saved);
    } else {
      setNightMode("auto");
    }
  }, []);

  // URL query orqali tez boshqarish (reloadsiz ham ishlaydi, lekin sizda hozir query doimiy emas)
  useEffect(() => {
    const qp = new URLSearchParams(window.location.search);
    const qNight = qp.get("night"); // "1" | "0" | "auto" | null

    if (qNight === "1") {
      setNightMode("on");
      localStorage.setItem("nightMode", "on");
    } else if (qNight === "0") {
      setNightMode("off");
      localStorage.setItem("nightMode", "off");
    } else if (qNight === "auto") {
      setNightMode("auto");
      localStorage.setItem("nightMode", "auto");
    }
  }, []);

  // Night mode qo‘llash (auto yoki manual)
  useEffect(() => {
    if (nightMode === "on") {
      applyNightModeClass(true);
      return;
    }

    if (nightMode === "off") {
      applyNightModeClass(false);
      return;
    }

    // AUTO: 20:00 - 06:00
    const updateAuto = () => {
      const hour = new Date().getHours();
      const enabled = hour >= 20 || hour < 6;
      applyNightModeClass(enabled);
    };

    updateAuto();

    // Har 1 daqiqada tekshirib turadi (vaqt o‘zgarsa avtomatik almashadi)
    const interval = setInterval(updateAuto, 60 * 1000);
    return () => clearInterval(interval);
  }, [nightMode]);

  const qp = new URLSearchParams(window.location.search);
  const debugProviders = qp.get("debugProviders") === "1";
  const debugRealtime = qp.get("debugRealtime") === "1";

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
          Input: {
            controlHeightLG: 55,
            borderRadiusLG: 14,
          },
        },
      }}
    >
      <BrowserRouter>
        <ScrollToTop />

        {/* Debug panellar (URL orqali yoqiladi) */}
        {debugProviders ? (
          <div className="p-3">
            <ProviderSwitchPanel />
          </div>
        ) : null}

        {debugRealtime ? (
          <div className="p-3">
            <OrderRealtimeDebug />
          </div>
        ) : null}

        <Routes>
          {/* ASOSIY YO'NALISH */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* DASHBOARD */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/main" element={<MainPage />} />

          {/* CLIENT SERVICES */}
          <Route path="/freight" element={<ClientFreight onBack={() => window.history.back()} />} />
          <Route
            path="/inter-district"
            element={<ClientInterDistrict onBack={() => window.history.back()} />}
          />

          {/* DRIVER MODE ✅ */}
          <Route path="/driver" element={<Navigate to="/driver-mode" replace />} />
          <Route
            path="/driver-mode"
            element={<DriverAuth onBack={() => window.history.back()} />}
          />
          <Route path="/driver-home" element={<DriverHome />} />
          <Route path="/driver/map" element={<DriverMap />} />

          {/* SUPER PRO PAGES */}
          {appConfig.features.garage ? <Route path="/garage" element={<GaragePage />} /> : null}
          {appConfig.features.payments ? <Route path="/payments" element={<PaymentsPage />} /> : null}
          {appConfig.features.searchOnRoute ? (
            <Route path="/search-route" element={<SearchOnRoutePage />} />
          ) : null}

          {/* XATO YO'NALISH */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
