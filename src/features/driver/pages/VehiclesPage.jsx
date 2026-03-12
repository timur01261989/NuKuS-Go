import React, { memo } from "react";
import DriverSettingsPage from "./DriverSettingsPage";

function VehiclesPage() {
  return <DriverSettingsPage forceTab="vehicles" />;
}

export default memo(VehiclesPage);
