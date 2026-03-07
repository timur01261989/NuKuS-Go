/**
 * App.jsx - TO'LIQ VA TO'G'IRLANGAN VERSIYA (260+ QATOR)
 * -------------------------------------------------------
 * MUHIM O'ZGARIŞLAR:
 * 1. AppModeProvider barcha kontentni o'rab turuvchi eng tashqi qatlam qilib belgilandi.
 * 2. Tartib: AppModeProvider > ConfigProvider > LanguageProvider > BrowserRouter.
 * 3. RoleGate uchun @shared alias o'rniga nisbiy yo'l ishlatildi (xatolikni oldini olish uchun).
 * * Manzil: src/App.jsx
 */

import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, Spin } from "antd";
import { LanguageProvider } from "./shared/i18n/LanguageContext";
import { AppModeProvider } from "./providers/AppModeProvider"; 
import RoleGate from "./shared/routes/RoleGate";
import "./styles/hdr-taxi.css";

import { appConfig } from "./shared/config/appConfig";
import MapSingletonLayout from "./features/map/layout/MapSingletonLayout.jsx";

// --- SUPER PRO / LEGACY FEATURES ---
// Ushbu qismlar maxsus funksiyalar uchun javobgar
const GaragePage = lazy(() => import("./pages/SuperPro/GaragePage"));
const PaymentsPage = lazy(() => import("./pages/SuperPro/PaymentsPage"));
const SearchOnRoutePage = lazy(() => import("./pages/SuperPro/SearchOnRoutePage"));

// --- PAGES (LAZY LOADING) ---
// Tizim tezligini oshirish uchun barcha sahifalar lazy-load qilinadi
const Auth = lazy(() => import("./features/auth/pages/Auth"));
const Register = lazy(() => import("./features/auth/pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const RootRedirect = lazy(() => import("./pages/RootRedirect"));
const Logout = lazy(() => import("./pages/Logout"));
const Support = lazy(() => import("./pages/Support"));
const SupportChatPage = lazy(() => import("./pages/SupportChatPage"));
const Settings = lazy(() => import("./pages/Settings"));
const MyAddresses = lazy(() => import("./pages/MyAddresses"));
const DevHub = lazy(() => import("./pages/DevHub"));
const AutoMarketEntry = lazy(() => import("./pages/AutoMarket/AutoMarketEntry"));

// --- CLIENT FEATURES (MIJOZ) ---
const ClientHome = lazy(() => import("./features/client/pages/ClientHome"));
const ClientSearch = lazy(() => import("./features/client/pages/ClientSearch"));
const ClientProfile = lazy(() => import("./features/client/pages/ClientProfile"));
const ClientOrders = lazy(() => import("./features/client/pages/ClientOrders"));

// --- DRIVER FEATURES (HAYDOVCHI) ---
const DriverDashboard = lazy(() => import("./features/driver/pages/DriverDashboard"));
const DriverRegister = lazy(() => import("./features/driver/pages/DriverRegister"));
const DriverPending = lazy(() => import("./pages/DriverPending"));
const InterDistrictHome = lazy(() => import("./features/interDistrict/pages/InterDistrictHome"));

// --- ADMIN FEATURES ---
const AdminDashboard = lazy(() => import("./features/admin/pages/AdminDashboard"));

/**
 * LoadingScreen - Sahifalar yuklanayotgan vaqtda ko'rinadigan ekran
 */
const LoadingScreen = () => (
  <div style={{ 
    height: "100vh", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    background: "#f5f5f5",
    flexDirection: "column",
    gap: "16px"
  }}>
    <Spin size="large" />
    <span style={{ color: "#1677ff", fontWeight: 500 }}>Yuklanmoqda...</span>
  </div>
);

export default function App() {
  return (
    <AppModeProvider>
      <ConfigProvider theme={appConfig.antdTheme}>
        <LanguageProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* --- OCHIQ MARSHRUTLAR (PUBLIC) ---
                  Ushbu sahifalarga kirish uchun login shart emas
                */}
                <Route path="/login" element={<Auth />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/logout" element={<Logout />} />

                {/* --- ASOSIY YO'NALTIRUVCHI (ROOT) ---
                  Kirgan foydalanuvchining roli va rejimiga qarab tegishli joyga yuboradi
                */}
                <Route 
                  path="/" 
                  element={
                    <RoleGate allow={{ client: true, driver: true, admin: true }}>
                      <RootRedirect />
                    </RoleGate>
                  } 
                />

                {/* --- MIJOZ YO'LLARI (CLIENT ROUTES) ---
                  Faqat mijoz (client) rolidagilar kirishi mumkin
                */}
                <Route element={<RoleGate allow={{ client: true }}><MapSingletonLayout /></RoleGate>}>
                  <Route path="/client/home" element={<ClientHome />} />
                  <Route path="/client/search" element={<ClientSearch />} />
                </Route>
                
                <Route 
                  path="/client/profile" 
                  element={<RoleGate allow={{ client: true }}><ClientProfile /></RoleGate>} 
                />
                <Route 
                  path="/client/orders" 
                  element={<RoleGate allow={{ client: true }}><ClientOrders /></RoleGate>} 
                />

                {/* --- HAYDOVCHI YO'LLARI (DRIVER ROUTES) ---
                  Haydovchilik arizasi va dashboard qismlari
                */}
                <Route 
                  path="/driver/register" 
                  element={<RoleGate allow={{ client: true, driver: true }}><DriverRegister /></RoleGate>} 
                />
                <Route 
                  path="/driver/pending" 
                  element={<RoleGate allow={{ client: true, driver: true }}><DriverPending /></RoleGate>} 
                />
                <Route 
                  path="/driver/dashboard" 
                  element={<RoleGate allow={{ driver: true }}><DriverDashboard /></RoleGate>} 
                />
                <Route 
                  path="/driver/home" 
                  element={<RoleGate allow={{ driver: true }}><InterDistrictHome /></RoleGate>} 
                />

                {/* --- ADMIN PANEL ---
                  Faqat administratorlar uchun
                */}
                <Route 
                  path="/admin/*" 
                  element={<RoleGate allow={{ admin: true }}><AdminDashboard /></RoleGate>} 
                />

                {/* --- UMUMIY YO'LLAR (SHARED ROUTES) ---
                  Ham haydovchi, ham mijoz foydalanishi mumkin bo'lgan bo'limlar
                */}
                <Route 
                  path="/support" 
                  element={<RoleGate allow={{ client: true, driver: true }}><Support /></RoleGate>} 
                />
                <Route 
                  path="/support/chat" 
                  element={<RoleGate allow={{ client: true, driver: true }}><SupportChatPage /></RoleGate>} 
                />
                <Route 
                  path="/settings" 
                  element={<RoleGate allow={{ client: true, driver: true }}><Settings /></RoleGate>} 
                />
                <Route 
                  path="/my-addresses" 
                  element={<RoleGate allow={{ client: true, driver: true }}><MyAddresses /></RoleGate>} 
                />

                {/* --- QO'SHIMCHA XIZMATLAR (SUPER PRO / LEGACY) ---
                */}
                <Route 
                  path="/garage" 
                  element={<RoleGate allow={{ client: true, driver: true }}><GaragePage /></RoleGate>} 
                />
                <Route 
                  path="/payments" 
                  element={<RoleGate allow={{ client: true, driver: true }}><PaymentsPage /></RoleGate>} 
                />
                <Route 
                  path="/search-on-route" 
                  element={<RoleGate allow={{ client: true, driver: true }}><SearchOnRoutePage /></RoleGate>} 
                />
                <Route 
                  path="/auto-market" 
                  element={<RoleGate allow={{ client: true, driver: true }}><AutoMarketEntry /></RoleGate>} 
                />

                {/* --- DEV / DEBUG ---
                */}
                <Route path="/dev" element={<DevHub />} />

                {/* --- XATO YO'LLAR (FALLBACK) ---
                  Mavjud bo'lmagan yo'lga kirilsa, asosiy sahifaga qaytaradi
                */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </LanguageProvider>
      </ConfigProvider>
    </AppModeProvider>
  );
}