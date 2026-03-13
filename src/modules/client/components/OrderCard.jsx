import React, { memo } from "react";
import DriverCard from "@/modules/client/features/client/taxi/components/DriverCard.jsx";

function OrderCard(props) {
  return <DriverCard {...props} />;
}

export default memo(OrderCard);
