import React, { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";

function DriverLayoutComponent() {
  const location = useLocation();

  const layoutClassName = useMemo(() => {
    const normalizedPath = location.pathname.replace(/^\//, "").replace(/\//g, "-") || "driver";
    return `unigo-layout unigo-layout-driver route-${normalizedPath}`;
  }, [location.pathname]);

  return (
    <div className={layoutClassName} data-layout="driver" data-route={location.pathname}>
      <Outlet />
    </div>
  );
}

export default React.memo(DriverLayoutComponent);
