import React, { memo } from "react";
import TaxiOrderTimeline from "@/modules/client/features/client/taxi/components/TaxiOrderTimeline.jsx";

function OrderStatus(props) {
  return <TaxiOrderTimeline {...props} />;
}

export default memo(OrderStatus);
