import React, { memo } from "react";
import FreightPage from "../../freight/FreightPage";
import ServiceAccessGate from "./ServiceAccessGate";

function DriverFreightComponent(props) {
  return (
    <ServiceAccessGate
      serviceKey="freight"
      title="Yuk tashish"
      description="Yuk tashish buyurtmalari aktiv mashina, yuk sig‘imi va haydovchi sozlamalari bo‘yicha chiqariladi."
    >
      <FreightPage {...props} />
    </ServiceAccessGate>
  );
}

export default memo(DriverFreightComponent);
