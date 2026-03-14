import React, { Suspense, lazy, memo, useMemo } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ClientLayout from "../layout/ClientLayout.jsx";
import DriverLayout from "../layout/DriverLayout.jsx";
import AuthGuard from "../guards/AuthGuard.jsx";
import DriverGuard from "../guards/DriverGuard.jsx";
import ClientRoutes from "./ClientRoutes.jsx";
import DriverRoutes from "./DriverRoutes.jsx";

const AuthPage = lazy(() => import("../../modules/client/features/auth/pages/Auth.jsx"));
const RegisterPage = lazy(() => import("../../modules/client/features/auth/pages/Register.jsx"));
const ReferralInviteLanding = lazy(() => import("../../modules/client/features/auth/pages/ReferralInviteLanding.jsx"));
const DriverRegisterPage = lazy(() => import("../../modules/driver/registration/DriverRegister.jsx"));
const DriverPendingPage = lazy(() => import("../../modules/driver/registration/DriverPending.jsx"));

const RouteFallback = memo(function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-10 text-center text-sm text-slate-500">
      Sahifa yuklanmoqda...
    </div>
  );
});

function AppRouterComponent({ appRole }) {
  const defaultRoot = useMemo(() => (appRole === "driver" ? "/driver" : "/"), [appRole]);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/r/:code" element={<ReferralInviteLanding />} />
          <Route path="/invite/:code" element={<ReferralInviteLanding />} />
          <Route path="/reset-password" element={<Navigate replace to="/login" />} />

          <Route element={<AuthGuard />}>
            <Route element={<ClientLayout />}>
              {ClientRoutes()}
            </Route>
          </Route>

          <Route path="/driver/register" element={<DriverRegisterPage />} />
          <Route path="/driver/pending" element={<DriverPendingPage />} />

          <Route element={<DriverGuard />}>
            <Route element={<DriverLayout />}>
              {DriverRoutes()}
            </Route>
          </Route>

          <Route path="*" element={<Navigate replace to={defaultRoot} />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default memo(AppRouterComponent);
