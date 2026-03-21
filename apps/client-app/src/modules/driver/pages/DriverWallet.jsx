import React from "react";
import LegacyScreen from "@/modules/driver/legacy/pages/DriverWalletPage.jsx";

function DriverWalletPage(props) {
  return <LegacyScreen {...props} />;
}

export default React.memo(DriverWalletPage);
