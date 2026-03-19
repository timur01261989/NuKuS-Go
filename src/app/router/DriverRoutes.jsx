import React, { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "./routePaths.js";

/* Lazy-loaded driver pages */
const DriverHome = lazy(() => import("../../modules/driver/pages/DriverHome.jsx"));
const DriverOrders = lazy(() => import("../../modules/driver/pages/DriverOrders.jsx"));
const DriverWallet = lazy(() => import("../../modules/driver/pages/DriverWallet.jsx"));
const DriverProfile = lazy(() => import("../../modules/driver/pages/DriverProfile.jsx"));
const DriverActiveOrder = lazy(() => import("../../modules/driver/pages/DriverActiveOrder.jsx"));
const DriverSettings = lazy(() => import("../../modules/driver/pages/DriverSettings.jsx"));
const DriverVehicles = lazy(() => import("../../modules/driver/pages/DriverVehicles.jsx"));
const DriverInsights = lazy(() => import("../../modules/driver/pages/DriverInsights.jsx"));
const DriverReferral = lazy(() => import("../../modules/driver/pages/DriverReferral.jsx"));

function DriverRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.driver.home} element={<DriverHome />} />
      <Route path={ROUTES.driver.orders} element={<DriverOrders />} />
      <Route path={ROUTES.driver.activeOrder} element={<DriverActiveOrder />} />
      <Route path={ROUTES.driver.wallet} element={<DriverWallet />} />
      <Route path={ROUTES.driver.profile} element={<DriverProfile />} />
      <Route path={ROUTES.driver.settings} element={<DriverSettings />} />
      <Route path={ROUTES.driver.vehicles} element={<DriverVehicles />} />
      <Route path={ROUTES.driver.insights} element={<DriverInsights />} />
      <Route path={ROUTES.driver.referral} element={<DriverReferral />} />

      {/* Legacy redirects */}
      <Route path={ROUTES.legacy.driverHome} element={<Navigate replace to={ROUTES.driver.home} />} />
      <Route path={ROUTES.legacy.driverDashboard} element={<Navigate replace to={ROUTES.driver.home} />} />
    </Routes>
  );
}

export default DriverRoutes;
