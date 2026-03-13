import React from "react";
import { Outlet } from "react-router-dom";

function DriverLayout() {
  return <Outlet />;
}

export default React.memo(DriverLayout);
