import React, { memo } from "react";
import InterDistrictPage from "../../inter-district/InterDistrictPage.jsx";
import ServiceAccessGate from "./ServiceAccessGate";

function DriverInterDistrictComponent(props) {
  return (
    <ServiceAccessGate
      serviceKey="interDist"
      title="Tumanlararo"
      description="Tumanlararo yo‘lovchi, eltish va yuk buyurtmalari haydovchi capability va aktiv mashina sig‘imi bo‘yicha filtrlanadi."
    >
      <InterDistrictPage {...props} />
    </ServiceAccessGate>
  );
}

export default memo(DriverInterDistrictComponent);
