import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/config';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OTPVerifyPage from './pages/auth/OTPVerifyPage';

// Client Pages
import ClientHomePage from './pages/client/HomePage';
import CityTaxiPage from './pages/client/CityTaxiPage';
import IntercityPage from './pages/client/IntercityPage';
import DistrictPage from './pages/client/DistrictPage';
import DeliveryPage from './pages/client/DeliveryPage';
import AutoMarketPage from './pages/client/AutoMarketPage';
import MyAddressesPage from './pages/client/MyAddressesPage';
import ClientOrdersPage from './pages/client/OrdersPage';
import SettingsPage from './pages/client/SettingsPage';

// Driver Pages
import DriverHomePage from './pages/driver/HomePage';
import DriverCityTaxiPage from './pages/driver/CityTaxiPage';
import DriverIntercityPage from './pages/driver/IntercityPage';
import DriverDistrictPage from './pages/driver/DistrictPage';
import DriverDeliveryPage from './pages/driver/DeliveryPage';
import DriverRoutes from './pages/driver/RoutesPage';
import DriverEarningsPage from './pages/driver/EarningsPage';
import DriverSettingsPage from './pages/driver/SettingsPage';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Loading Component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Spin size="large" />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#f59e0b',
              colorInfo: '#3b82f6',
              borderRadius: 12,
            },
          }}
        >
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Root */}
                <Route path="/" element={<Navigate to="/auth/login" replace />} />

                {/* Auth Routes */}
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
                <Route path="/auth/verify-otp" element={<OTPVerifyPage />} />

                {/* Client Routes */}
                <Route path="/client" element={<ProtectedRoute role="client" />}>
                  <Route path="home" element={<ClientHomePage />} />
                  <Route path="city-taxi" element={<CityTaxiPage />} />
                  <Route path="intercity" element={<IntercityPage />} />
                  <Route path="district" element={<DistrictPage />} />
                  <Route path="delivery" element={<DeliveryPage />} />
                  <Route path="auto-market" element={<AutoMarketPage />} />
                  <Route path="addresses" element={<MyAddressesPage />} />
                  <Route path="orders" element={<ClientOrdersPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Driver Routes */}
                <Route path="/driver" element={<ProtectedRoute role="driver" />}>
                  <Route path="home" element={<DriverHomePage />} />
                  <Route path="city-taxi" element={<DriverCityTaxiPage />} />
                  <Route path="intercity" element={<DriverIntercityPage />} />
                  <Route path="district" element={<DriverDistrictPage />} />
                  <Route path="delivery" element={<DriverDeliveryPage />} />
                  <Route path="routes" element={<DriverRoutes />} />
                  <Route path="earnings" element={<DriverEarningsPage />} />
                  <Route path="settings" element={<DriverSettingsPage />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ConfigProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;
