import React from "react";
import LegacyComponent from "@/modules/driver/legacy/components/DriverOnlineToggle.jsx";

function OnlineToggleComponent(props) {
  return <LegacyComponent {...props} />;
}

export default React.memo(OnlineToggleComponent);
