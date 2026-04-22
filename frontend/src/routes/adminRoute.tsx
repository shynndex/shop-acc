import { AdminRoute } from "@/components/admin/routes/AdminRoute";
import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const AdminLogin = lazy(() => import("@/pages/admin/Login"));
const AdminDeposits = lazy(() => import("@/pages/admin/Deposits"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminConfig = lazy(() => import("@/pages/admin/Config"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));

export const adminRoutes = (
  <Route path="/admin">
    {/* Public routes */}
    <Route path="login" element={<AdminLogin />} />

    <Route element={<AdminRoute />}>
      <Route index element={<AdminDashboard />} />
      <Route path="deposits" element={<AdminDeposits />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="configuration" element={<AdminConfig />} />
    </Route>

    <Route path="*" element={<Navigate to="/admin" replace />} />
  </Route>
);
