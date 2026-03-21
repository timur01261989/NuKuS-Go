import React from "react";
import LegacyScreen from "@/modules/driver/legacy/pages/DriverOrders.jsx";

function DriverActiveOrderPage(props) {
  return <LegacyScreen {...props} />;
}

export default React.memo(DriverActiveOrderPage);
