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

/**
 * safeLazy
 * Wraps React.lazy to provide clearer error messages when a chunk fails to load.
 * Usage: const Page = safeLazy(() => import('./Page.jsx'), 'Page');
 */
function safeLazy(importFn, name = "Component") {
  return lazy(() =>
    importFn().catch((err) => {
      // Throw a new Error with context so ErrorBoundary shows a helpful message
      // and window.__UNIGO_LAST_ERROR contains meaningful info.
      throw new Error(`${name} failed to load: ${err?.message || String(err)}`);
    })
  );
}

/* Lazy-loaded pages (wrapped with safeLazy for better diagnostics) */
const AuthPage = safeLazy(() => import("../../modules/client/features/auth/pages/Auth.jsx"), "AuthPage");
const RegisterPage = safeLazy(() => import("../../modules/client/features/auth/pages/Register.jsx"), "RegisterPage");
const ReferralInviteLanding = safeLazy(() => import("../../modules/client/features/auth/pages/ReferralInviteLanding.jsx"), "ReferralInviteLanding");
const DriverRegisterPage = safeLazy(() => import("../../modules/driver/registration/DriverRegister.jsx"), "DriverRegisterPage");
const DriverPendingPage = safeLazy(() => import("../../modules/driver/registration/DriverPending.jsx"), "DriverPendingPage");
const ResetPasswordPage = safeLazy(() => import("../../modules/client/pages/pages/ResetPassword.jsx"), "ResetPasswordPage");

/* Suspense fallback shown while lazy chunks load */
const RouteFallback = memo(function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-10 text-center text-sm text-slate-500">
      Sahifa yuklanmoqda...
    </div>
  );
});

/* Localized error UI for route-level failures (keeps ErrorBoundary generic) */
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

/**
 * AppRouterComponent
 * - Wraps the whole router with a top-level ErrorBoundary and Suspense.
 * - Uses safeLazy for clearer lazy-load errors.
 * - Avoids passing unsupported props to ErrorBoundary (keep it generic).
 */
function AppRouterComponent({ appRole }) {
  const defaultRoot = useMemo(
    () => (appRole === "driver" ? ROUTES.driver.home : ROUTES.client.home),
    [appRole]
  );

  return (
    // Top-level ErrorBoundary catches render-time errors in the router tree
    <ErrorBoundary>
      {/* Top-level Suspense handles lazy chunk loading for public routes */}
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
              <Route
                path="/*"
                element={
                  // Route-level ErrorBoundary + Suspense to isolate client routes
                  <ErrorBoundary>
                    <Suspense fallback={<RouteFallback />}>
                      <ClientRoutes />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
            </Route>
          </Route>

          {/* Driver Registration / Pending */}
          <Route path={ROUTES.driver.register} element={<DriverRegisterPage />} />
          <Route path={ROUTES.driver.pending} element={<DriverPendingPage />} />

          {/* Driver Segment (Protected & Isolated) */}
          <Route element={<DriverGuard />}>
            <Route element={<DriverLayout />}>
              <Route
                path="/*"
                element={
                  // Route-level ErrorBoundary + Suspense to isolate driver routes
                  <ErrorBoundary>
                    <Suspense fallback={<RouteFallback />}>
                      <DriverRoutes />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
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
