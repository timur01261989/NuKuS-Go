import React from "react";
import LegacyScreen from "@/modules/driver/legacy/pages/DriverOrders.jsx";

function DriverOrdersPage(props) {
  return <LegacyScreen {...props} />;
}

export default React.memo(DriverOrdersPage);
