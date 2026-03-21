import React, { memo } from "react";
import ETAWidget from "@/modules/client/features/client/taxi/components/ETAWidget.jsx";

function DriverTracker(props) {
  return <ETAWidget {...props} />;
}

export default memo(DriverTracker);
