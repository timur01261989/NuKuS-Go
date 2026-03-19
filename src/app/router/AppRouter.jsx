import React, { Suspense, lazy, memo, useMemo } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ClientLayout from "../layout/ClientLayout.jsx";
import DriverLayout from "../layout/DriverLayout.jsx";
import AuthGuard from "../guards/AuthGuard.jsx";
import DriverGuard from "../guards/DriverGuard.jsx";
import ClientRoutes from "./ClientRoutes.jsx";
import DriverRoutes from "./DriverRoutes.jsx";
import { ROUTES } from "./routePaths.js";
import ErrorBoundary from "../../modules/shared/components/ErrorBoundary.jsx";

const AuthPage = lazy(() => import("../../modules/client/features/auth/pages/Auth.jsx"));
const RegisterPage = lazy(() => import("../../modules/client/features/auth/pages/Register.jsx"));
const ReferralInviteLanding = lazy(() => import("../../modules/client/features/auth/pages/ReferralInviteLanding.jsx"));
const DriverRegisterPage = lazy(() => import("../../modules/driver/registration/DriverRegister.jsx"));
const DriverPendingPage = lazy(() => import("../../modules/driver/registration/DriverPending.jsx"));
const ResetPasswordPage = lazy(() => import("../../modules/client/pages/pages/ResetPassword.jsx"));

// Normal holatdagi Suspense kutilmasi
const RouteFallback = memo(function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-10 text-center text-sm text-slate-500">
      Sahifa yuklanmoqda...
    </div>
  );
});

// Tarmoq uzilishi yoki Chunk yuklanmay qolganda ishlaydigan lokalizatsiyalangan xatolik ekrani
const RouteErrorFallback = memo(function RouteErrorFallback() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center p-6 text-center">
      <h2 className="text-lg font-semibold text-slate-800">Tizimga ulanishda xatolik</h2>
      <p className="mt-2 text-sm text-slate-500">Iltimos, internet aloqangizni tekshiring va sahifani yangilang.</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 rounded-md bg-orange-500 px-6 py-2 text-white shadow-sm transition-colors hover:bg-orange-600 focus:outline-none"
      >
        Qayta urinish
      </button>
    </div>
  );
});

function AppRouterComponent({ appRole }) {
  const defaultRoot = useMemo(
    () => (appRole === "driver" ? ROUTES.driver.home : ROUTES.client.home),
    [appRole]
  );

  return (
    <ErrorBoundary fallback={<RouteErrorFallback />}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.auth.login} element={<AuthPage />} />
          <Route path={ROUTES.auth.register} element={<RegisterPage />} />
          <Route path={ROUTES.referral.shortInvite} element={<ReferralInviteLanding />} />
          <Route path={ROUTES.referral.invite} element={<ReferralInviteLanding />} />
          <Route path={ROUTES.auth.resetPassword} element={<ResetPasswordPage />} />

          {/* Client Segment (Protected & Isolated) */}
          <Route element={<AuthGuard />}>
            <Route element={<ClientLayout />}>
              <Route path="/*" element={
                <ErrorBoundary fallback={<RouteErrorFallback />}>
                  <ClientRoutes />
                </ErrorBoundary>
              } />
            </Route>
          </Route>

          {/* Driver Registration / Pending */}
          <Route path={ROUTES.driver.register} element={<DriverRegisterPage />} />
          <Route path={ROUTES.driver.pending} element={<DriverPendingPage />} />

          {/* Driver Segment (Protected & Isolated) */}
          <Route element={<DriverGuard />}>
            <Route element={<DriverLayout />}>
              <Route path="/*" element={
                <ErrorBoundary fallback={<RouteErrorFallback />}>
                  <DriverRoutes />
                </ErrorBoundary>
              } />
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate replace to={defaultRoot} />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default memo(AppRouterComponent);