
import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "../../modules/client/pages/Home.jsx";
import TaxiOrder from "../../modules/client/pages/TaxiOrder.jsx";
import DeliveryOrder from "../../modules/client/pages/DeliveryOrder.jsx";
import Wallet from "../../modules/client/pages/Wallet.jsx";
import Profile from "../../modules/client/pages/Profile.jsx";

function ClientRoutes(){

  return (
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/taxi" element={<TaxiOrder/>}/>
      <Route path="/delivery" element={<DeliveryOrder/>}/>
      <Route path="/wallet" element={<Wallet/>}/>
      <Route path="/profile" element={<Profile/>}/>
    </Routes>
  )

}

export default React.memo(ClientRoutes);
