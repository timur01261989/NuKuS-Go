import React, { memo } from "react";
import LegacyScreen from "@/modules/driver/legacy/pages/VehiclesPage.jsx";

function DriverVehiclesPage(props) {
  return <LegacyScreen {...props} />;
}

export default memo(DriverVehiclesPage);
