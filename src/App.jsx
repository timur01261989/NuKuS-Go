import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';

import { appConfig } from './shared/config/appConfig';
import GaragePage from './pages/SuperPro/GaragePage';
import PaymentsPage from './pages/SuperPro/PaymentsPage';
import SearchOnRoutePage from './pages/SuperPro/SearchOnRoutePage';

// --- SAHIFALAR (PAGES) ---
import Login from './pages/Auth';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import MainPage from './pages/MainPage';

// --- MIJOZ KOMPONENTLARI ---
import ClientFreight from "./features/client/components/ClientFreight";
import ClientInterDistrict from './features/client/components/ClientInterDistrict';

// --- HAYDOVCHI MODE ---
import DriverAuth from './features/driver/components/DriverAuth';
import DriverHome from './features/driver/components/DriverHome';
import { prioritizeAssets } from './utils/BaselineProfile';
import { OrderRealtimeDebug } from './features/taxi/components/OrderRealtimeDebug.jsx';
import { ProviderSwitchPanel } from './feature/debug/components/ProviderSwitchPanel.jsx';

// Sahifalar almashganda skrolni tepaga qaytarish
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  // Ilova yuklanishi bilan optimizatsiyalar
  useEffect(() => {
    prioritizeAssets();
  }, []);

  // Night mode (20:00 - 06:00)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 20 || hour < 6) document.body.classList.add('night-mode-active');
    else document.body.classList.remove('night-mode-active');
  }, []);

  const qp = new URLSearchParams(window.location.search);
  const debugProviders = qp.get('debugProviders') === '1';
  const debugRealtime = qp.get('debugRealtime') === '1';

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FFD700',
          borderRadius: 12,
          fontFamily: 'YangoHeadline, Inter, -apple-system, system-ui, sans-serif',
        },
        components: {
          Button: {
            controlHeightLG: 55,
            fontWeight: 800,
            borderRadiusLG: 16,
          },
          Card: {
            borderRadiusLG: 24,
            boxShadowTertiary: '0 12px 32px rgba(0,0,0,0.12)',
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

          {/* CLIENT SERVICES */}
          <Route path="/freight" element={<ClientFreight onBack={() => window.history.back()} />} />
          <Route path="/inter-district" element={<ClientInterDistrict onBack={() => window.history.back()} />} />
          <Route path="/main" element={<MainPage />} />

          {/* DRIVER MODE */}
          <Route path="/driver-mode" element={<DriverAuth onBack={() => window.history.back()} />} />
          <Route path="/driver-home" element={<DriverHome />} />

          {/* SUPER PRO PAGES */}
          {appConfig.features.garage && <Route path="/garage" element={<GaragePage />} />}
          {appConfig.features.payments && <Route path="/payments" element={<PaymentsPage />} />}
          {appConfig.features.searchOnRoute && <Route path="/search-route" element={<SearchOnRoutePage />} />}

          {/* XATO YO'NALISH */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
