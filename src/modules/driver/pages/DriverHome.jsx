import React from "react";
import LegacyScreen from "@/modules/driver/legacy/pages/DriverDashboard.jsx";

function DriverHomePage(props) {
  return <LegacyScreen {...props} />;
}

export default React.memo(DriverHomePage);
