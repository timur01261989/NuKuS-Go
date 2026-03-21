import React, { Suspense, lazy, memo, useMemo } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ClientLayout from "../layout/ClientLayout.jsx";
import DriverLayout from "../layout/DriverLayout.jsx";
import AuthGuard from "../guards/AuthGuard.jsx";
import DriverGuard from "../guards/DriverGuard.jsx";
import ClientRoutes from "./ClientRoutes.jsx";
import DriverRoutes from "./DriverRoutes.jsx";
import { ROUTES } from "./routePaths.js";

const AuthPage = lazy(() => import("../../modules/client/features/auth/pages/Auth.jsx"));
const RegisterPage = lazy(() => import("../../modules/client/features/auth/pages/Register.jsx"));
const ReferralInviteLanding = lazy(() => import("../../modules/client/features/auth/pages/ReferralInviteLanding.jsx"));
const DriverRegisterPage = lazy(() => import("../../modules/driver/registration/DriverRegister.jsx"));
const DriverPendingPage = lazy(() => import("../../modules/driver/registration/DriverPending.jsx"));
const ResetPasswordPage = lazy(() => import("../../modules/client/pages/pages/ResetPassword.jsx"));

const RouteFallback = memo(function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-10 text-center text-sm text-slate-500">
      Sahifa yuklanmoqda...
    </div>
  );
});

function AppRouterComponent({ appRole }) {
  const defaultRoot = useMemo(
    () => (appRole === "driver" ? ROUTES.driver.home : ROUTES.client.home),
    [appRole]
  );

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path={ROUTES.auth.login} element={<AuthPage />} />
          <Route path={ROUTES.auth.register} element={<RegisterPage />} />
          <Route path={ROUTES.referral.shortInvite} element={<ReferralInviteLanding />} />
          <Route path={ROUTES.referral.invite} element={<ReferralInviteLanding />} />
          <Route path={ROUTES.auth.resetPassword} element={<ResetPasswordPage />} />

          <Route element={<AuthGuard />}>
            <Route element={<ClientLayout />}>
              <ClientRoutes />
            </Route>
          </Route>

          <Route path={ROUTES.driver.register} element={<DriverRegisterPage />} />
          <Route path={ROUTES.driver.pending} element={<DriverPendingPage />} />

          <Route element={<DriverGuard />}>
            <Route element={<DriverLayout />}>
              <DriverRoutes />
            </Route>
          </Route>

          <Route path="*" element={<Navigate replace to={defaultRoot} />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default memo(AppRouterComponent);
