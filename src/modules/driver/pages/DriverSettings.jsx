import React, { memo } from "react";
import LegacyScreen from "@/modules/driver/legacy/pages/DriverSettingsPage.jsx";

function DriverSettingsPage(props) {
  return <LegacyScreen {...props} />;
}

export default memo(DriverSettingsPage);
