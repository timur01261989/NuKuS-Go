import React, { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

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
    <>
      <Route path="/driver" element={<DriverHome />} />
      <Route path="/driver/orders" element={<DriverOrders />} />
      <Route path="/driver/active-order" element={<DriverActiveOrder />} />
      <Route path="/driver/wallet" element={<DriverWallet />} />
      <Route path="/driver/profile" element={<DriverProfile />} />
      <Route path="/driver/settings" element={<DriverSettings />} />
      <Route path="/driver/vehicles" element={<DriverVehicles />} />
      <Route path="/driver/insights" element={<DriverInsights />} />
      <Route path="/driver/referral" element={<DriverReferral />} />
      <Route path="/driver/home" element={<Navigate replace to="/driver" />} />
    </>
  );
}

export default DriverRoutes;
