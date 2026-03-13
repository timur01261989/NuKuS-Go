import React from "react";
import { Navigate, Route } from "react-router-dom";
import DriverHome from "../../modules/driver/pages/DriverHome.jsx";
import DriverOrders from "../../modules/driver/pages/DriverOrders.jsx";
import DriverWallet from "../../modules/driver/pages/DriverWallet.jsx";
import DriverProfile from "../../modules/driver/pages/DriverProfile.jsx";
import DriverActiveOrder from "../../modules/driver/pages/DriverActiveOrder.jsx";

function DriverRoutes() {
  return (
    <>
      <Route path="/driver" element={<DriverHome />} />
      <Route path="/driver/orders" element={<DriverOrders />} />
      <Route path="/driver/active-order" element={<DriverActiveOrder />} />
      <Route path="/driver/wallet" element={<DriverWallet />} />
      <Route path="/driver/profile" element={<DriverProfile />} />
      <Route path="/driver/home" element={<Navigate replace to="/driver" />} />
    </>
  );
}

export default DriverRoutes;
