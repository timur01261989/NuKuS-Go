import React, { Suspense, memo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "./routePaths.js";
import ErrorBoundary from "../../modules/shared/components/ErrorBoundary.jsx";

/**
 * safeLazy
 * Wraps React.lazy to provide clearer error messages when a chunk fails to load.
 */
function safeLazy(importFn, name = "Component") {
  return React.lazy(() =>
    importFn().catch((err) => {
      throw new Error(`${name} failed to load: ${err?.message || String(err)}`);
    })
  );
}

/* Lazy-loaded pages (wrapped with safeLazy for better diagnostics) */
const Home = safeLazy(() => import("../../modules/client/pages/Home.jsx"), "Home");
const TaxiOrder = safeLazy(() => import("../../modules/client/pages/TaxiOrder.jsx"), "TaxiOrder");
const DeliveryOrder = safeLazy(() => import("../../modules/client/pages/DeliveryOrder.jsx"), "DeliveryOrder");
const FreightOrder = safeLazy(() => import("../../modules/client/pages/FreightOrder.jsx"), "FreightOrder");
const IntercityOrder = safeLazy(() => import("../../modules/client/pages/IntercityOrder.jsx"), "IntercityOrder");
const InterdistrictOrder = safeLazy(() => import("../../modules/client/pages/InterdistrictOrder.jsx"), "InterdistrictOrder");
const Wallet = safeLazy(() => import("../../modules/client/pages/Wallet.jsx"), "Wallet");
const Profile = safeLazy(() => import("../../modules/client/pages/Profile.jsx"), "Profile");
const Referral = safeLazy(() => import("../../modules/client/pages/Referral.jsx"), "Referral");
const Settings = safeLazy(() => import("../../modules/client/pages/Settings.jsx"), "Settings");
const AutoMarket = safeLazy(() => import("../../modules/client/pages/AutoMarket.jsx"), "AutoMarket");
const ClientNavigator = safeLazy(() => import("../../modules/client/pages/ClientNavigator.jsx"), "ClientNavigator");
const ClientPromo = safeLazy(() => import("../../modules/client/features/client/pages/ClientPromo.jsx"), "ClientPromo");

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
function withRouteWrappers(Component, name) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * ClientRoutes
 * Returns a self-contained <Routes> tree so it can be rendered as an element.
 * Each route element is wrapped with Suspense + ErrorBoundary to isolate failures.
 */
export default function ClientRoutes() {
  return (
    <Routes>
      {/* Primary client routes */}
      <Route index element={withRouteWrappers(Home, "Home")} />
      <Route path={ROUTES.client.home} element={withRouteWrappers(Home, "Home")} />
      <Route path={ROUTES.client.taxi} element={withRouteWrappers(TaxiOrder, "TaxiOrder")} />
      <Route path={ROUTES.client.delivery} element={withRouteWrappers(DeliveryOrder, "DeliveryOrder")} />
      <Route path={ROUTES.client.freight} element={withRouteWrappers(FreightOrder, "FreightOrder")} />
      <Route path={ROUTES.client.intercity} element={withRouteWrappers(IntercityOrder, "IntercityOrder")} />
      <Route path={ROUTES.client.interdistrict} element={withRouteWrappers(InterdistrictOrder, "InterdistrictOrder")} />
      <Route path={ROUTES.client.wallet} element={withRouteWrappers(Wallet, "Wallet")} />
      <Route path={ROUTES.client.profile} element={withRouteWrappers(Profile, "Profile")} />
      <Route path={ROUTES.client.referral} element={withRouteWrappers(Referral, "Referral")} />
      <Route path={ROUTES.client.promo} element={withRouteWrappers(ClientPromo, "ClientPromo")} />
      <Route path={ROUTES.client.settings} element={withRouteWrappers(Settings, "Settings")} />
      <Route path={`${ROUTES.client.autoMarket}/*`} element={withRouteWrappers(AutoMarket, "AutoMarket")} />
      <Route path={ROUTES.client.navigator} element={withRouteWrappers(ClientNavigator, "ClientNavigator")} />

      {/* Legacy redirects */}
      <Route path={ROUTES.legacy.navigator} element={<Navigate replace to={ROUTES.client.navigator} />} />
      <Route path={ROUTES.legacy.clientHome} element={<Navigate replace to={ROUTES.client.home} />} />
      <Route path={ROUTES.legacy.clientTaxi} element={<Navigate replace to={ROUTES.client.taxi} />} />
      <Route path={ROUTES.legacy.clientDelivery} element={<Navigate replace to={ROUTES.client.delivery} />} />
      <Route path={ROUTES.legacy.clientFreight} element={<Navigate replace to={ROUTES.client.freight} />} />
      <Route path={ROUTES.legacy.clientInterProvincial} element={<Navigate replace to={ROUTES.client.intercity} />} />
      <Route path={ROUTES.legacy.clientInterDistrict} element={<Navigate replace to={ROUTES.client.interdistrict} />} />
      <Route path={ROUTES.legacy.clientWallet} element={<Navigate replace to={ROUTES.client.wallet} />} />
      <Route path={ROUTES.legacy.clientProfile} element={<Navigate replace to={ROUTES.client.profile} />} />
      <Route path={ROUTES.legacy.clientReferral} element={<Navigate replace to={ROUTES.client.referral} />} />
      <Route path={ROUTES.legacy.clientPromo} element={<Navigate replace to={ROUTES.client.promo} />} />
      <Route path={ROUTES.legacy.clientSettings} element={<Navigate replace to={ROUTES.client.settings} />} />
      <Route path={`${ROUTES.legacy.market}/*`} element={<Navigate replace to={ROUTES.client.autoMarket} />} />
    </Routes>
  );
}
