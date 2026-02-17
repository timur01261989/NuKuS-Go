import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, Spin } from "antd";
import { LanguageProvider } from "@shared/i18n/LanguageContext";
import RoleGate from "@shared/routes/RoleGate";
import "./styles/hdr-taxi.css";

import { appConfig } from "./shared/config/appConfig";

// --- SUPER PRO / LEGACY FEATURES ---
const GaragePage = lazy(() => import("./pages/SuperPro/GaragePage"));
const PaymentsPage = lazy(() => import("./pages/SuperPro/PaymentsPage"));
const SearchOnRoutePage = lazy(() => import("./pages/SuperPro/SearchOnRoutePage"));

// --- PAGES (LAZY) ---
const Auth = lazy(() => import("./features/auth/pages/Auth"));
const Register = lazy(() => import("./features/auth/pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MainPage = lazy(() => import("./pages/MainPage"));
const RootRedirect = lazy(() => import("./pages/RootRedirect"));
const Logout = lazy(() => import("./pages/Logout"));
const Support = lazy(() => import("./pages/Support"));
const MyAddresses = lazy(() => import("./pages/MyAddresses"));
const ClientOrders = lazy(() => import("./pages/ClientOrders"));
const DriverPending = lazy(() => import("./pages/DriverPending"));

// --- CLIENT ---
const ClientHome = lazy(() => import("@features/client/pages/ClientHome"));
const ClientTaxi = lazy(() => import("@features/client/taxi/ClientTaxiPage"));
const ClientIntercity = lazy(() => import("@features/client/intercity/ClientIntercityPage"));
const ClientInterDistrict = lazy(() => import("@features/client/interDistrict/ClientInterDistrictPage"));
const ClientFreight = lazy(() => import("@features/client/freight/ClientFreightPage"));
const ClientDelivery = lazy(() => import("@features/client/delivery/DeliveryPage"));

// --- DRIVER ---
const DriverOrders = lazy(() => import("@features/driver/pages/DriverOrders"));
const DriverDashboard = lazy(() => import("@features/driver/pages/DriverDashboard"));

// --- SETTINGS ---
const Settings = lazy(() => import("@features/settings/pages/Settings"));

// --- AUTO MARKET ---
const AutoMarketEntry = lazy(() => import("./features/auto-market/AutoMarketEntry"));

// --- DEV ---
const DevHub = lazy(() => import("./pages/DevHub"));

function PageLoader() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" />
    </div>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* --- PUBLIC --- */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/logout" element={<Logout />} />

              {/* --- DASHBOARD --- */}
              <Route path="/dashboard" element={<Navigate to="/client/home" replace />} />

              {/* --- CLIENT --- */}

	              <Route path="/client" element={<Navigate to="/client/home" replace />} />
	              <Route
                path="/client/home"
                element={
                  <RoleGate allow={{ client: true, driver: false }}>
                    <ClientHome />
                  </RoleGate>
                }
              />
              <Route
                path="/client/taxi"
                element={
                  <RoleGate allow={{ client: true, driver: false }}>
                    <ClientTaxi />
                  </RoleGate>
                }
              />
	              <Route
	                path="/client/inter-provincial"
	                element={
	                  <RoleGate allow={{ client: true, driver: false }}>
	                    <ClientIntercity />
	                  </RoleGate>
	                }
	              />
	              <Route
	                path="/client/inter-district"
	                element={
	                  <RoleGate allow={{ client: true, driver: false }}>
	                    <ClientInterDistrict />
	                  </RoleGate>
	                }
	              />
	              <Route
	                path="/client/freight"
	                element={
	                  <RoleGate allow={{ client: true, driver: false }}>
	                    <ClientFreight />
	                  </RoleGate>
	                }
	              />
	              <Route
	                path="/client/delivery"
	                element={
	                  <RoleGate allow={{ client: true, driver: false }}>
	                    <ClientDelivery />
	                  </RoleGate>
	                }
	              />
              <Route
                path="/client/orders"
                element={
                  <RoleGate allow={{ client: true, driver: false }}>
                    <ClientOrders />
                  </RoleGate>
                }
              />
              <Route
                path="/client/addresses"
                element={
                  <RoleGate allow={{ client: true, driver: false }}>
                    <MyAddresses />
                  </RoleGate>
                }
              />

              {/* --- AUTO MARKET --- */}
              <Route path="/auto-market/*" element={<AutoMarketEntry />} />

              {/* --- SETTINGS / SUPPORT --- */}
              <Route path="/settings" element={<Settings />} />
              <Route path="/support" element={<Support />} />

              {/* --- DRIVER (PROTECTED) --- */}
	              <Route path="/driver" element={<Navigate to="/driver/dashboard" replace />} />
	              {/* eski menyuda /driver/home ishlatilgan */}
	              <Route path="/driver/home" element={<Navigate to="/driver/dashboard" replace />} />
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

              {/* --- SUPER PRO / LEGACY FEATURES --- */}
              {appConfig.features.garage && <Route path="/garage" element={<GaragePage />} />}
              {appConfig.features.payments && <Route path="/payments" element={<PaymentsPage />} />}
              {appConfig.features.searchOnRoute && <Route path="/search-route" element={<SearchOnRoutePage />} />}

              {/* --- DEV (HIDDEN) --- */}
              <Route path="/__dev" element={<DevHub />} />

              {/* --- FALLBACK --- */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </ConfigProvider>
  );
}
