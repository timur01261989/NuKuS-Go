import React from "react";
import LegacyComponent from "@/modules/driver/legacy/components/DriverWallet.jsx";

function EarningsCardComponent(props) {
  return <LegacyComponent {...props} />;
}

export default React.memo(EarningsCardComponent);
