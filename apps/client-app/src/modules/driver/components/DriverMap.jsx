import React from "react";
import LegacyComponent from "@/modules/driver/legacy/components/DriverMap.jsx";

function DriverMapComponent(props) {
  return <LegacyComponent {...props} />;
}

export default React.memo(DriverMapComponent);
