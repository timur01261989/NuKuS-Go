import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, Spin } from "antd";
import { LanguageProvider } from "@shared/i18n/LanguageContext";
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
// Dashboard va MainPage import qilinmaydi — route'da ishlatilmaydi
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
const DriverModeRedirect = lazy(() => import("@shared/routes/DriverModeRedirect")); // YANGI

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

              {/* --- CLIENT MAP SINGLETON (services) --- */}
              <Route
                path="/client"
                element={
                  <RoleGate allow={{ client: true, driver: true }}>
                    <MapSingletonLayout />
                  </RoleGate>
                }
              >
                <Route path="home" element={<ClientHome />} />
                <Route path="taxi" element={<ClientTaxi />} />
                <Route path="inter-provincial" element={<ClientIntercity />} />
                <Route path="inter-district" element={<ClientInterDistrict />} />
                <Route path="freight" element={<ClientFreight />} />
                <Route path="delivery" element={<ClientDelivery />} />
              </Route>

<Route
                path="/client/orders"
                element={
                  <RoleGate allow={{ client: true, driver: true }}>
                    <ClientOrders />
                  </RoleGate>
                }
              />
              <Route
                path="/client/addresses"
                element={
                  <RoleGate allow={{ client: true, driver: true }}>
                    <MyAddresses />
                  </RoleGate>
                }
              />

              <Route
                path="/client/wallet"
                element={
                  <RoleGate allow={{ client: true, driver: true }}>
                    <ClientWallet />
                  </RoleGate>
                }
              />
              <Route
                path="/client/profile"
                element={
                  <RoleGate allow={{ client: true, driver: true }}>
                    <ClientProfile />
                  </RoleGate>
                }
              />
              <Route
                path="/client/payment-methods"
                element={
                  <RoleGate allow={{ client: true, driver: true }}>
                    <ClientPaymentMethods />
                  </RoleGate>
                }
              />
              <Route
                path="/client/promo"
                element={
                  <RoleGate allow={{ client: true, driver: true }}>
                    <ClientPromo />
                  </RoleGate>
                }
              />

              {/* --- AUTO MARKET --- */}
              <Route path="/auto-market/*" element={<AutoMarketEntry />} />
              <Route path="/market/*" element={<AutoMarketEntry />} />

              {/* --- SETTINGS / SUPPORT --- */}
              <Route path="/settings" element={<Settings />} />
              <Route path="/support" element={<Support />} />

              <Route
  path="/client/support/:orderId"
  element={
    <RoleGate allow={{ client: true, driver: true }}>
      <SupportChatPage role="client" />
    </RoleGate>
  }
/>
              {/* --- DRIVER (PROTECTED) --- */}
              <Route path="/driver" element={<Navigate to="/driver/dashboard" replace />} />
              {/* eski menyuda /driver/home ishlatilgan */}
              <Route path="/driver/home" element={<Navigate to="/driver/dashboard" replace />} />
              {/* /driver-mode -> DriverModeRedirect (location state o'tkaza oladi) */}
              <Route path="/driver-mode" element={<DriverModeRedirect />} />

              <Route
                path="/driver/register"
                element={
                  <RoleGate allow={{ client: true, driver: true, requireDriverApproved: false }}>
                    <DriverRegister />
                  </RoleGate>
                }
              />

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
                  <RoleGate allow={{ client: false, driver: true, requireDriverApproved: false, allowPending: true }}>
                    <DriverPending />
                  </RoleGate>
                }
              />
              <Route
  path="/driver/insights"
  element={
    <RoleGate allow={{ client: false, driver: true, requireDriverApproved: true }}>
      <DriverInsights />
    </RoleGate>
  }
/>
<Route
  path="/driver/support/:orderId"
  element={
    <RoleGate allow={{ client: false, driver: true, requireDriverApproved: true }}>
      <SupportChatPage role="driver" />
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
                path="/driver/wallet"
                element={
                  <RoleGate allow={{ client: false, driver: true, requireDriverApproved: true }}>
                    <DriverWalletPage />
                  </RoleGate>
                }
              />
              <Route
                path="/driver/profile"
                element={
                  <RoleGate allow={{ client: false, driver: true, requireDriverApproved: true }}>
                    <DriverProfilePage />
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