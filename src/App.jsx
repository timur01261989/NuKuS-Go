import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ConfigProvider } from "antd";
import { LanguageProvider } from "@shared/i18n/LanguageContext";
import RoleGate from "@shared/routes/RoleGate";
import "./styles/hdr-taxi.css";

import { appConfig } from "./shared/config/appConfig";
import { routes as _routes } from "./app/routes.jsx";
import GaragePage from "./pages/SuperPro/GaragePage";
import PaymentsPage from "./pages/SuperPro/PaymentsPage";
import SearchOnRoutePage from "./pages/SuperPro/SearchOnRoutePage";

// --- SAHIFALAR (PAGES) ---
import Auth from "./features/auth/pages/Auth";
import Register from "./features/auth/pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import MainPage from "./pages/MainPage";
import Logout from "./pages/Logout";
import Support from "./pages/Support";
import MyAddresses from "./pages/MyAddresses";

// --- CLIENT ---
import ClientHome from "@features/client/pages/ClientHome";
import ClientTaxi from "@features/client/components/ClientTaxi";
import ClientOrders from "./pages/ClientOrders";

// --- DRIVER ---
import DriverOrders from "@features/driver/pages/DriverOrders";
import DriverDashboard from "@features/driver/pages/DriverDashboard";
import DriverPending from "./pages/DriverPending";
// import DriverInterDistrict from "@features/driver/pages/DriverInterDistrict"; // Agar bu fayllar bor bo'lsa kommentdan oling
// import DriverFreight from "@features/driver/pages/DriverFreight";
// import DriverDelivery from "@features/driver/pages/DriverDelivery";

// --- SETTINGS ---
import Settings from "@features/settings/pages/Settings";

// 👇 MANA SHU YER TUZATILDI (Import manzili)
import AutoMarketEntry from "./features/auto-market/AutoMarketEntry";

// --- LAZY LOADING (DEV) ---
const DevHub = lazy(() => import("./pages/DevHub"));

export default function App() {
  return (
    <ConfigProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            
            {/* --- ASOSIY SAHIFALAR (PUBLIC) --- */}
            <Route path="/" element={<MainPage />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/logout" element={<Logout />} />
            
            {/* --- DASHBOARD --- */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* --- CLIENT (YO'LOVCHI) UCHUN --- */}
            <Route path="/client/home" element={<ClientHome />} />
            <Route path="/client/taxi" element={<ClientTaxi />} />
            <Route path="/client/orders" element={<ClientOrders />} />
            <Route path="/client/addresses" element={<MyAddresses />} />

            {/* 👇 AVTO BOZOR (AUTO MARKET) - TO'LIQ QO'SHILDI */}
            <Route path="/auto-market/*" element={<AutoMarketEntry />} />

            {/* --- UMUMIY SOZLAMALAR --- */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/support" element={<Support />} />

            {/* --- DRIVER (HAYDOVCHI) UCHUN - HIMOYALANGAN YO'LLAR --- */}
            <Route
              path="/driver/dashboard"
              element={
                <RoleGate allow={{ client: false, driver: true, requireDriverApproved: true }}>
                  <DriverDashboard />
                </RoleGate>
              }
            />
            <Route
              path="/driver/pending"
              element={
                <RoleGate allow={{ client: false, driver: true, requireDriverApproved: false }}>
                  <DriverPending />
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

            {/* --- QO'SHIMCHA HAYDOVCHI XIZMATLARI (Sizning faylingizdan tiklandi) --- */}
            {/* Agar bu komponentlar faylda import qilinmagan bo'lsa, xato berishi mumkin.
                Lekin sizning eski faylingizda bular bor edi. */}
            {/* <Route
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
            */}

            {/* --- SUPER PRO / LEGACY FEATURES --- */}
            {appConfig.features.garage && <Route path="/garage" element={<GaragePage />} />}
            {appConfig.features.payments && <Route path="/payments" element={<PaymentsPage />} />}
            {appConfig.features.searchOnRoute && <Route path="/search-route" element={<SearchOnRoutePage />} />}

            {/* --- FALLBACK (XATO MANZIL) --- */}
            <Route path="*" element={<Navigate to="/login" replace />} />

            {/* --- DEV (HIDDEN) --- */}
            <Route
              path="/__dev"
              element={
                <Suspense fallback={null}>
                  <DevHub />
                </Suspense>
              }
            />

          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ConfigProvider>
  );
}