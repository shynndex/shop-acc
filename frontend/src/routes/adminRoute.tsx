import AdminLayout from "@/components/admin/layout/AppLayout";
import { lazy } from "react";
import { Route } from "react-router-dom";

const AdminLogin = lazy(() => import("@/pages/admin/Login"));
const AdminDeposits = lazy(() => import("@/pages/admin/Deposit"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminAccounts = lazy(() => import("@/pages/admin/Accounts"));
const AdminGiftcodes = lazy(() => import("@/pages/admin/Giftcodes"));
const AdminReviews = lazy(() => import("@/pages/admin/Reviews"));
const AdminReconciliation = lazy(() => import("@/pages/admin/Reconciliation"));
const AdminUserBalance = lazy(() => import("@/pages/admin/UserBalance"));

export const adminRoutes = (
  <Route path="/admin">
    {/* Public routes */}
    <Route path="login" element={<AdminLogin />} />

    {/* Protected routes */}
    {/* <Route element={<AdminProtectedRoute />}> */}
    <Route element={<AdminLayout />}>
      <Route index element={<AdminDashboard />} />
      <Route path="deposits" element={<AdminDeposits />} />
      <Route path="accounts" element={<AdminAccounts />} />
      <Route path="giftcodes" element={<AdminGiftcodes />} />
      <Route path="reviews" element={<AdminReviews />} />
      <Route path="reconciliation" element={<AdminReconciliation />} />
      <Route path="users" element={<AdminUserBalance />} />
    </Route>
    {/* </Route> */}
  </Route>
);
