import React, { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const Home = lazy(() => import("../../modules/client/pages/Home.jsx"));
const TaxiOrder = lazy(() => import("../../modules/client/pages/TaxiOrder.jsx"));
const DeliveryOrder = lazy(() => import("../../modules/client/pages/DeliveryOrder.jsx"));
const FreightOrder = lazy(() => import("../../modules/client/pages/FreightOrder.jsx"));
const IntercityOrder = lazy(() => import("../../modules/client/pages/IntercityOrder.jsx"));
const InterdistrictOrder = lazy(() => import("../../modules/client/pages/InterdistrictOrder.jsx"));
const Wallet = lazy(() => import("../../modules/client/pages/Wallet.jsx"));
const ClientOrders = lazy(() => import("../../modules/client/pages/pages/ClientOrders.jsx"));
const Profile = lazy(() => import("../../modules/client/pages/Profile.jsx"));
const ProfileDetails = lazy(() => import("../../modules/client/pages/ProfileDetails.jsx"));
const Referral = lazy(() => import("../../modules/client/pages/Referral.jsx"));
const Settings = lazy(() => import("../../modules/client/pages/Settings.jsx"));
const AutoMarket = lazy(() => import("../../modules/client/pages/AutoMarket.jsx"));
const ClientNavigator = lazy(() => import("../../modules/client/pages/ClientNavigator.jsx"));
const ClientPromo = lazy(() => import("../../modules/client/features/client/pages/ClientPromo.jsx"));

function ClientRoutes() {
  return (
    <>
      <Route index element={<Home />} />
      <Route path="/" element={<Home />} />
      <Route path="/taxi" element={<TaxiOrder />} />
      <Route path="/delivery" element={<DeliveryOrder />} />
      <Route path="/freight" element={<FreightOrder />} />
      <Route path="/intercity" element={<IntercityOrder />} />
      <Route path="/interdistrict" element={<InterdistrictOrder />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/orders" element={<ClientOrders />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/details" element={<ProfileDetails />} />
      <Route path="/referral" element={<Referral />} />
      <Route path="/promo" element={<ClientPromo />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/auto-market/*" element={<AutoMarket />} />
      <Route path="/client/navigator" element={<ClientNavigator />} />
      <Route path="/navigator" element={<Navigate replace to="/client/navigator" />} />
      <Route path="/client/home" element={<Navigate replace to="/" />} />
      <Route path="/client/taxi" element={<Navigate replace to="/taxi" />} />
      <Route path="/client/delivery" element={<Navigate replace to="/delivery" />} />
      <Route path="/client/freight" element={<Navigate replace to="/freight" />} />
      <Route path="/client/inter-provincial" element={<Navigate replace to="/intercity" />} />
      <Route path="/client/inter-district" element={<Navigate replace to="/interdistrict" />} />
      <Route path="/client/wallet" element={<Navigate replace to="/wallet" />} />
      <Route path="/client/orders" element={<Navigate replace to="/orders" />} />
      <Route path="/client/profile" element={<Navigate replace to="/profile" />} />
      <Route path="/client/referral" element={<Navigate replace to="/referral" />} />
      <Route path="/client/promo" element={<Navigate replace to="/promo" />} />
      <Route path="/client/settings" element={<Navigate replace to="/settings" />} />
      <Route path="/market/*" element={<Navigate replace to="/auto-market" />} />
    </>
  );
}

export default ClientRoutes;
