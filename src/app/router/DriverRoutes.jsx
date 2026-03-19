import React, { Suspense, memo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "../../modules/shared/components/ErrorBoundary.jsx";
import safeLazy from "../router/safeLazy.js";
import { ROUTES } from "./routePaths.js";

/**
 * DriverRoutes.jsx
 *
 * - All driver routes are wrapped with ErrorBoundary + Suspense to isolate failures.
 * - Uses safeLazy to provide clearer errors when a chunk fails to load.
 * - Provides friendly fallbacks while lazy chunks are loading.
 */

/* Lazy-loaded driver pages (wrapped with safeLazy for better diagnostics) */
const DriverDashboard = safeLazy(() => import("../../modules/driver/pages/DriverDashboard.jsx"), "DriverDashboard");
const DriverJobs = safeLazy(() => import("../../modules/driver/pages/DriverJobs.jsx"), "DriverJobs");
const DriverProfile = safeLazy(() => import("../../modules/driver/pages/DriverProfile.jsx"), "DriverProfile");
const DriverWallet = safeLazy(() => import("../../modules/driver/pages/DriverWallet.jsx"), "DriverWallet");
const DriverSettings = safeLazy(() => import("../../modules/driver/pages/DriverSettings.jsx"), "DriverSettings");
const DriverNavigator = safeLazy(() => import("../../modules/driver/pages/DriverNavigator.jsx"), "DriverNavigator");

/* Fallback UI shown while lazy chunks load */
const RouteFallback = memo(function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-10 text-center text-sm text-slate-500">
      Sahifa yuklanmoqda...
    </div>
  );
});

/* Localized error UI for route-level failures */
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
 * Helper to wrap a lazy component with Suspense + ErrorBoundary
 * Keeps route definitions concise and consistent.
 */
function withRouteWrappers(Component) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * DriverRoutes
 * Returns a self-contained <Routes> tree so it can be rendered as an element.
 */
export default function DriverRoutes() {
  return (
    <Routes>
      <Route index element={withRouteWrappers(DriverDashboard)} />
      <Route path={ROUTES.driver.home} element={withRouteWrappers(DriverDashboard)} />
      <Route path={ROUTES.driver.jobs} element={withRouteWrappers(DriverJobs)} />
      <Route path={ROUTES.driver.profile} element={withRouteWrappers(DriverProfile)} />
      <Route path={ROUTES.driver.wallet} element={withRouteWrappers(DriverWallet)} />
      <Route path={ROUTES.driver.settings} element={withRouteWrappers(DriverSettings)} />
      <Route path={ROUTES.driver.navigator} element={withRouteWrappers(DriverNavigator)} />

      {/* Legacy redirects and catch-all */}
      <Route path={ROUTES.legacy.driverHome} element={<Navigate replace to={ROUTES.driver.home} />} />
      <Route path="*" element={<Navigate replace to={ROUTES.driver.home} />} />
    </Routes>
  );
}
