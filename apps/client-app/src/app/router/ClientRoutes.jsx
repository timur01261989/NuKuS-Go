import React, { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import { ROUTES } from "./routePaths.js";

const Home = lazy(() => import("../../modules/client/pages/Home.jsx"));
const TaxiOrder = lazy(() => import("../../modules/client/pages/TaxiOrder.jsx"));
const DeliveryOrder = lazy(() => import("../../modules/client/pages/DeliveryOrder.jsx"));
const FreightOrder = lazy(() => import("../../modules/client/pages/FreightOrder.jsx"));
const IntercityOrder = lazy(() => import("../../modules/client/pages/IntercityOrder.jsx"));
const InterdistrictOrder = lazy(() => import("../../modules/client/pages/InterdistrictOrder.jsx"));
const Wallet = lazy(() => import("../../modules/client/pages/Wallet.jsx"));
const Profile = lazy(() => import("../../modules/client/pages/Profile.jsx"));
const Referral = lazy(() => import("../../modules/client/pages/Referral.jsx"));
const Settings = lazy(() => import("../../modules/client/pages/Settings.jsx"));
const AutoMarket = lazy(() => import("../../modules/client/pages/AutoMarket.jsx"));
const ClientNavigator = lazy(() => import("../../modules/client/pages/ClientNavigator.jsx"));
const ClientPromo = lazy(() => import("../../modules/client/features/client/pages/ClientPromo.jsx"));

function ClientRoutes() {
  return (
    <>
      <Route index element={<Home />} />
      <Route path={ROUTES.client.home} element={<Home />} />
      <Route path={ROUTES.client.taxi} element={<TaxiOrder />} />
      <Route path={ROUTES.client.delivery} element={<DeliveryOrder />} />
      <Route path={ROUTES.client.freight} element={<FreightOrder />} />
      <Route path={ROUTES.client.intercity} element={<IntercityOrder />} />
      <Route path={ROUTES.client.interdistrict} element={<InterdistrictOrder />} />
      <Route path={ROUTES.client.wallet} element={<Wallet />} />
      <Route path={ROUTES.client.profile} element={<Profile />} />
      <Route path={ROUTES.client.referral} element={<Referral />} />
      <Route path={ROUTES.client.promo} element={<ClientPromo />} />
      <Route path={ROUTES.client.settings} element={<Settings />} />
      <Route path={`${ROUTES.client.autoMarket}/*`} element={<AutoMarket />} />
      <Route path={ROUTES.client.navigator} element={<ClientNavigator />} />
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
    </>
  );
}

export default ClientRoutes;
