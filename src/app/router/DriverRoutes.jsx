
import React from "react";
import { Routes, Route } from "react-router-dom";

import DriverHome from "../../modules/driver/pages/DriverHome.jsx";
import DriverOrders from "../../modules/driver/pages/DriverOrders.jsx";
import DriverWallet from "../../modules/driver/pages/DriverWallet.jsx";
import DriverProfile from "../../modules/driver/pages/DriverProfile.jsx";

function DriverRoutes(){

  return (
    <Routes>
      <Route path="/driver" element={<DriverHome/>}/>
      <Route path="/driver/orders" element={<DriverOrders/>}/>
      <Route path="/driver/wallet" element={<DriverWallet/>}/>
      <Route path="/driver/profile" element={<DriverProfile/>}/>
    </Routes>
  )

}

export default React.memo(DriverRoutes);
