import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";

const Dashboard   = lazy(() => import("./pages/dashboard/DashboardPage"));
const Users       = lazy(() => import("./pages/users/UsersPage"));
const Drivers     = lazy(() => import("./pages/drivers/DriversPage"));
const Orders      = lazy(() => import("./pages/orders/OrdersPage"));
const Finance     = lazy(() => import("./pages/finance/FinancePage"));
const Analytics   = lazy(() => import("./pages/analytics/AnalyticsPage"));

const Loader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <AdminLayout>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users"     element={<Users />} />
          <Route path="/drivers"   element={<Drivers />} />
          <Route path="/orders"    element={<Orders />} />
          <Route path="/finance"   element={<Finance />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
}
