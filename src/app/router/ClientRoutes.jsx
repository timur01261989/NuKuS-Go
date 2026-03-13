import React from "react";
import { Navigate, Route } from "react-router-dom";
import Home from "../../modules/client/pages/Home.jsx";
import TaxiOrder from "../../modules/client/pages/TaxiOrder.jsx";
import DeliveryOrder from "../../modules/client/pages/DeliveryOrder.jsx";
import FreightOrder from "../../modules/client/pages/FreightOrder.jsx";
import IntercityOrder from "../../modules/client/pages/IntercityOrder.jsx";
import InterdistrictOrder from "../../modules/client/pages/InterdistrictOrder.jsx";
import Wallet from "../../modules/client/pages/Wallet.jsx";
import Profile from "../../modules/client/pages/Profile.jsx";
import Settings from "../../modules/client/pages/Settings.jsx";
import AutoMarket from "../../modules/client/pages/AutoMarket.jsx";
import ClientNavigator from "../../modules/client/pages/ClientNavigator.jsx";

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
      <Route path="/profile" element={<Profile />} />
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
      <Route path="/client/profile" element={<Navigate replace to="/profile" />} />
      <Route path="/client/settings" element={<Navigate replace to="/settings" />} />
      <Route path="/market/*" element={<Navigate replace to="/auto-market" />} />
    </>
  );
}

export default ClientRoutes;
