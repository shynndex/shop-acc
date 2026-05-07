import AdminLayout from "@/components/admin/layout/AppLayout";
import { AdminProtectedRoute } from "@/components/admin/routes/AdminProtectedRoute";
import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const AdminLogin = lazy(() => import("@/pages/admin/Login"));
// const AdminDeposits = lazy(() => import("@/pages/admin/Deposits"));
// const AdminUsers = lazy(() => import("@/pages/admin/Users"));
// const AdminConfig = lazy(() => import("@/pages/admin/Config"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminAccounts = lazy(() => import("@/pages/admin/Accounts"));

export const adminRoutes = (
  <Route path="/admin">
    {/* Public routes */}
    <Route path="login" element={<AdminLogin />} />

    {/* Protected routes */}
    {/* <Route element={<AdminProtectedRoute />}> */}
    <Route element={<AdminLayout />}>
      <Route index element={<AdminDashboard />} />
      {/* <Route path="deposits" element={<AdminDeposits />} /> */}
      <Route path="accounts" element={<AdminAccounts />} />
      {/* <Route path="users" element={<AdminUsers />} /> */}
      {/* <Route path="configuration" element={<AdminConfig />} /> */}
    </Route>
    {/* </Route> */}

    {/* <Route path="*" element={<Navigate to="/admin" replace />} /> */}
  </Route>
);
