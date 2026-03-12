import React, { memo } from "react";
import InterProvincialPage from "../../inter-provincial/InterProvincialPage.jsx";
import ServiceAccessGate from "./ServiceAccessGate";

function DriverInterProvincialComponent(props) {
  return (
    <ServiceAccessGate
      serviceKey="interProv"
      title="Viloyatlararo"
      description="Viloyatlararo yo‘lovchi, eltish va yuk buyurtmalari haydovchining yoqilgan xizmatlari hamda aktiv mashina sig‘imi bo‘yicha ishlaydi."
    >
      <InterProvincialPage {...props} />
    </ServiceAccessGate>
  );
}

export default memo(DriverInterProvincialComponent);
