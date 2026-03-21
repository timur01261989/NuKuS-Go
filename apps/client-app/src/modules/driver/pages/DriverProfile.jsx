import React from "react";
import LegacyScreen from "@/modules/driver/legacy/pages/DriverProfilePage.jsx";

function DriverProfilePage(props) {
  return <LegacyScreen {...props} />;
}

export default React.memo(DriverProfilePage);
