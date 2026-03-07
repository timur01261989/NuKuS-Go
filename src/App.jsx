/**
 * App.jsx - CORRECTED VERSION (COMPLETE - 261 LINES)
 * 
 * CRITICAL FIX:
 * AppModeProvider MUST wrap ALL content - it's the OUTERMOST wrapper!
 * Order: AppModeProvider > ConfigProvider > LanguageProvider > BrowserRouter
 * 
 * Location: src/App.jsx
 * ACTION: Replace entire file with this content
 */

import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, Spin } from "antd";
import { LanguageProvider } from "@shared/i18n/LanguageContext";
import { AppModeProvider } from "./providers/AppModeProvider"; // ✅ ADD THIS IMPORT
import RoleGate from "@shared/routes/RoleGate";
import "./styles/hdr-taxi.css";

import { appConfig } from "./shared/config/appConfig";
import MapSingletonLayout from "./features/map/layout/MapSingletonLayout.jsx";

// --- SUPER PRO / LEGACY FEATURES ---
const GaragePage = lazy(() => import("./pages/SuperPro/GaragePage"));
const PaymentsPage = lazy(() => import("./pages/SuperPro/PaymentsPage"));
const SearchOnRoutePage = lazy(() => import("./pages/SuperPro/SearchOnRoutePage"));

// --- PAGES (LAZY) ---
const Auth = lazy(() => import("./features/auth/pages/Auth"));
const Register = lazy(() => import("./features/auth/pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const RootRedirect = lazy(() => import("./pages/RootRedirect"));
const Logout = lazy(() => import("./pages/Logout"));
const Support = lazy(() => import("./pages/Support"));
const MyAddresses = lazy(() => import("./pages/MyAddresses"));
const ClientOrders = lazy(() => import("./pages/ClientOrders"));
const DriverPending = lazy(() => import("./pages/DriverPending"));

// --- CLIENT ---
const ClientHome = lazy(() => import("@features/client/pages/ClientHome"));
const ClientWallet = lazy(() => import("@features/client/pages/ClientWallet"));
const ClientProfile = lazy(() => import("@features/client/pages/ClientProfile"));
const ClientPaymentMethods = lazy(() => import("@features/client/pages/ClientPaymentMethods"));
const ClientPromo = lazy(() => import("@features/client/pages/ClientPromo"));
const ClientTaxi = lazy(() => import("@features/client/taxi/ClientTaxiPage"));
const ClientIntercity = lazy(() => import("@features/client/intercity/ClientIntercityPage"));
const ClientInterDistrict = lazy(() => import("@features/client/interDistrict/ClientInterDistrictPage"));
const ClientFreight = lazy(() => import("@features/client/freight/ClientFreightPage"));
const ClientDelivery = lazy(() => import("@features/client/delivery/DeliveryPage"));

// --- DRIVER ---
const DriverOrders = lazy(() => import("@features/driver/pages/DriverOrders"));
const DriverDashboard = lazy(() => import("@features/driver/pages/DriverDashboard"));
const DriverInsights = lazy(() => import("@features/driver/pages/DriverInsights"));
const SupportChatPage = lazy(() => import("./features/support/SupportChatPage"));
const DriverWalletPage = lazy(() => import("@features/driver/pages/DriverWalletPage"));
const DriverProfilePage = lazy(() => import("@features/driver/pages/DriverProfilePage"));
const DriverRegister = lazy(() => import("@features/driver/components/DriverRegister"));
const DriverModeRedirect = lazy(() => import("@shared/routes/DriverModeRedirect"));

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
    // ✅ CRITICAL: AppModeProvider MUST be OUTERMOST wrapper
    <AppModeProvider>
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

                {/* --- DRIVER MODE SWITCH --- */}
                <Route path="/driver-mode" element={<DriverModeRedirect />} />

                {/* --- CLIENT ROUTES --- */}
                <Route
                  path="/client/home"
                  element={
                    <RoleGate allow={{ client: true, driver: true }}>
                      <MapSingletonLayout>
                        <ClientHome />
                      </MapSingletonLayout>
                    </RoleGate>
                  }
                />
                <Route path="/client/wallet" element={<RoleGate allow={{ client: true, driver: true }}><ClientWallet /></RoleGate>} />
                <Route path="/client/profile" element={<RoleGate allow={{ client: true, driver: true }}><ClientProfile /></RoleGate>} />
                <Route path="/client/payment-methods" element={<RoleGate allow={{ client: true, driver: true }}><ClientPaymentMethods /></RoleGate>} />
                <Route path="/client/promo" element={<RoleGate allow={{ client: true, driver: true }}><ClientPromo /></RoleGate>} />
                <Route path="/client/taxi" element={<RoleGate allow={{ client: true, driver: true }}><ClientTaxi /></RoleGate>} />
                <Route path="/client/intercity" element={<RoleGate allow={{ client: true, driver: true }}><ClientIntercity /></RoleGate>} />
                <Route path="/client/interdistrict" element={<RoleGate allow={{ client: true, driver: true }}><ClientInterDistrict /></RoleGate>} />
                <Route path="/client/freight" element={<RoleGate allow={{ client: true, driver: true }}><ClientFreight /></RoleGate>} />
                <Route path="/client/delivery" element={<RoleGate allow={{ client: true, driver: true }}><ClientDelivery /></RoleGate>} />
                <Route path="/client/orders" element={<RoleGate allow={{ client: true, driver: true }}><ClientOrders /></RoleGate>} />

                {/* --- DRIVER ROUTES --- */}
                <Route path="/driver/register" element={<RoleGate allow={{ driver: true, client: true }}><DriverRegister /></RoleGate>} />
                <Route path="/driver/pending" element={<RoleGate allow={{ driver: true, allowPending: true }}><DriverPending /></RoleGate>} />
                <Route path="/driver/dashboard" element={<RoleGate allow={{ driver: true, requireDriverApproved: true }}><DriverDashboard /></RoleGate>} />
                <Route path="/driver/home" element={<RoleGate allow={{ driver: true, requireDriverApproved: true }}><DriverDashboard /></RoleGate>} />
                <Route path="/driver/orders" element={<RoleGate allow={{ driver: true, requireDriverApproved: true }}><DriverOrders /></RoleGate>} />
                <Route path="/driver/insights" element={<RoleGate allow={{ driver: true, requireDriverApproved: true }}><DriverInsights /></RoleGate>} />
                <Route path="/driver/wallet" element={<RoleGate allow={{ driver: true }}><DriverWalletPage /></RoleGate>} />
                <Route path="/driver/profile" element={<RoleGate allow={{ driver: true }}><DriverProfilePage /></RoleGate>} />

                {/* --- SHARED --- */}
                <Route path="/support" element={<RoleGate allow={{ client: true, driver: true }}><Support /></RoleGate>} />
                <Route path="/support/chat" element={<RoleGate allow={{ client: true, driver: true }}><SupportChatPage /></RoleGate>} />
                <Route path="/settings" element={<RoleGate allow={{ client: true, driver: true }}><Settings /></RoleGate>} />
                <Route path="/my-addresses" element={<RoleGate allow={{ client: true, driver: true }}><MyAddresses /></RoleGate>} />

                {/* --- SUPER PRO / LEGACY --- */}
                <Route path="/garage" element={<RoleGate allow={{ client: true, driver: true }}><GaragePage /></RoleGate>} />
                <Route path="/payments" element={<RoleGate allow={{ client: true, driver: true }}><PaymentsPage /></RoleGate>} />
                <Route path="/search-on-route" element={<RoleGate allow={{ client: true, driver: true }}><SearchOnRoutePage /></RoleGate>} />
                <Route path="/auto-market" element={<RoleGate allow={{ client: true, driver: true }}><AutoMarketEntry /></RoleGate>} />

                {/* --- DEV --- */}
                <Route path="/dev" element={<DevHub />} />

                {/* --- FALLBACK --- */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </LanguageProvider>
      </ConfigProvider>
    </AppModeProvider>
  );
}
