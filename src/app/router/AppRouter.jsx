import React, { useMemo } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ClientLayout from "../layout/ClientLayout.jsx";
import DriverLayout from "../layout/DriverLayout.jsx";
import AuthGuard from "../guards/AuthGuard.jsx";
import DriverGuard from "../guards/DriverGuard.jsx";
import ClientRoutes from "./ClientRoutes.jsx";
import DriverRoutes from "./DriverRoutes.jsx";
import AuthPage from "../../modules/client/features/auth/pages/Auth.jsx";
import RegisterPage from "../../modules/client/features/auth/pages/Register.jsx";
import DriverRegisterPage from "../../modules/driver/registration/DriverRegister.jsx";
import DriverPendingPage from "../../modules/driver/registration/DriverPending.jsx";

function AppRouterComponent({ appRole }) {
  const defaultRoot = useMemo(() => {
    if (appRole === "driver") return "/driver";
    return "/";
  }, [appRole]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<Navigate replace to="/login" />} />

        <Route element={<AuthGuard />}>
          <Route element={<ClientLayout />}>
            {ClientRoutes()}
          </Route>
        </Route>

        <Route path="/driver/register" element={<DriverRegisterPage />} />
        <Route path="/driver/pending" element={<DriverPendingPage />} />

        <Route element={<DriverGuard />}>
          <Route element={<DriverLayout />}>
            {DriverRoutes()}
          </Route>
        </Route>

        <Route path="*" element={<Navigate replace to={defaultRoot} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default React.memo(AppRouterComponent);
