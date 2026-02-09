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
import Dashboard from "./pages/Dashboard";
import MainPage from './pages/MainPage';

// --- MIJOZ KOMPONENTLARI ---
import ClientFreight from './components/client/ClientFreight'; 
import ClientInterDistrict from './components/client/ClientInterDistrict';

// --- HAYDOVCHI MODE ---
import DriverAuth from './components/driver/DriverAuth';
import DriverHome from './components/driver/DriverHome'; 

import { prioritizeAssets } from './utils/BaselineProfile';
import { OrderRealtimeDebug } from './components/taxi/OrderRealtimeDebug.jsx';
import { ProviderSwitchPanel } from './components/debug/ProviderSwitchPanel.jsx';

export default function App() {
  useEffect(() => {
    // Ilova yuklanishi bilan Baseline Profile optimizatsiyasini ishga tushiramiz
    prioritizeAssets();

    function App() {
      useEffect(() => {
        const hour = new Date().getHours();
        // Soat 20:00 dan tonggi 06:00 gacha Night Mode
        if (hour >= 20 || hour < 6) {
          document.body.classList.add('night-mode-active');
        } else {
          document.body.classList.remove('night-mode-active');
        }
      }, []);

        const qp = new URLSearchParams(window.location.search);
  const debugProviders = qp.get('debugProviders') === '1';
  const debugRealtime = qp.get('debugRealtime') === '1';

  return (
        <div className="app-container">
          {/* Sizning router yoki asosiy komponentlaringiz */}
        </div>
      );
    }

    export default App;
    // Service Worker-ni ro'yxatdan o'tkazish
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  return (
    // ... mavjud kodingiz
  );
}
// Sahifalar almashganda skrolni tepaga qaytarish uchun yordamchi
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
/* Marker silliq harakatlanishi uchun */
.leaflet-marker-icon {
  transition: transform 2s linear !important; /* 2 soniya davomida silliq siljiydi */
}

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FFD700', // Nukus Go Sariq rangi
          borderRadius: 12,
          // Protobuf mantiqi: YangoHeadline shriftini birinchi darajali qilish
          fontFamily: 'YangoHeadline, Inter, -apple-system, system-ui, sans-serif',
        },
        components: {
          Button: {
            controlHeightLG: 55,
            fontWeight: 800, // Yandex Go kabi qalin tugmalar
            borderRadiusLG: 16,
          },
          Card: {
            borderRadiusLG: 24,
            // Occlusion va HDR effekti uchun chuqur soyalar
            boxShadowTertiary: '0 12px 32px rgba(0,0,0,0.12)', 
          },
          Input: {
            controlHeightLG: 55,
            borderRadiusLG: 14,
          }
        },
      }}
    >
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* ASOSIY YO'NALISH */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* AUTH PAGES (SMS Retriever va Auth-API-Phone qo'shilgan) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* MAIN DASHBOARD */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* CLIENT SERVICES (Distance Calculations va Routing qo'shilgan) */}
          <Route path="/freight" element={<ClientFreight onBack={() => window.history.back()} />} />
          <Route path="/inter-district" element={<ClientInterDistrict onBack={() => window.history.back()} />} />
          <Route path="/main" element={<MainPage />} />

          {/* DRIVER MODE (FIDO2 va Biometrik kirish qatlamlari bilan) */}
          <Route path="/driver-mode" element={<DriverAuth onBack={() => window.history.back()} />} />
          <Route path="/driver-home" element={<DriverHome />} />

          {/* SUPER PRO PAGES (feature flags) */}
          {appConfig.features.garage && (
            <Route path="/garage" element={<GaragePage />} />
          )}
          {appConfig.features.payments && (
            <Route path="/payments" element={<PaymentsPage />} />
          )}
          {appConfig.features.searchOnRoute && (
            <Route path="/search-route" element={<SearchOnRoutePage />} />
          )}


          {/* XATO YO'NALISH */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
</ConfigProvider>
  );
}