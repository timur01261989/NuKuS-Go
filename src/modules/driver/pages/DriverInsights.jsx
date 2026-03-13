import React, { memo } from "react";
import LegacyScreen from "@/modules/driver/legacy/pages/DriverInsights.jsx";

function DriverInsightsPage(props) {
  return <LegacyScreen {...props} />;
}

export default memo(DriverInsightsPage);
