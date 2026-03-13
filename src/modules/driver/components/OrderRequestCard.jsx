import React from "react";
import LegacyComponent from "@/modules/driver/legacy/components/NewOrderModal.jsx";

function OrderRequestCardComponent(props) {
  return <LegacyComponent {...props} />;
}

export default React.memo(OrderRequestCardComponent);
