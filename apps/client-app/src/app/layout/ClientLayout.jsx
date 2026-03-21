import React, { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";

function ClientLayoutComponent() {
  const location = useLocation();

  const layoutClassName = useMemo(() => {
    const normalizedPath = location.pathname === "/" ? "home" : location.pathname.replace(/^\//, "").replace(/\//g, "-");
    return `unigo-layout unigo-layout-client unigo-mobile-app route-${normalizedPath}`;
  }, [location.pathname]);

  return (
    <div className={layoutClassName} data-layout="client" data-route={location.pathname}>
      <Outlet />
    </div>
  );
}

export default React.memo(ClientLayoutComponent);
