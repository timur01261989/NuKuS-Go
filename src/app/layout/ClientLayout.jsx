import React from "react";
import { Outlet } from "react-router-dom";

function ClientLayout() {
  return <Outlet />;
}

export default React.memo(ClientLayout);
