import AdminLayout from "@/components/admin/layout/AppLayout";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { lazy } from "react";

import { AdminProtectedRoute } from "@/components/admin/routes/AdminProtectedRoute";
import { Route } from "react-router-dom";

const AdminLogin = lazy(() => import("@/pages/admin/Login"));
const AdminAdmins = lazy(() => import("@/pages/admin/Admins"));
const AdminDeposits = lazy(() => import("@/pages/admin/Deposit"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminAccounts = lazy(() => import("@/pages/admin/Accounts"));
const AdminGiftcodes = lazy(() => import("@/pages/admin/Giftcodes"));
const AdminReviews = lazy(() => import("@/pages/admin/Reviews"));
const AdminReconciliation = lazy(() => import("@/pages/admin/Reconciliation"));
const AdminUserBalance = lazy(() => import("@/pages/admin/UserBalance"));
const AdminAuditLogs = lazy(() => import("@/pages/admin/AuditLogs"));
const AdminOrders = lazy(() => import("@/pages/admin/Orders"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminPaymentMonitoring = lazy(() => import("@/pages/admin/PaymentMonitoring"));
const AdminConfig = lazy(() => import("@/pages/admin/Config"));
const AdminProfile = lazy(() => import("@/pages/admin/Profile"));

/**
 * Wrap a route element with ErrorBoundary for per-route error isolation.
 * Resets the boundary when the route changes (pathname changes).
 */
function withErrorBoundary(
  Component: React.LazyExoticComponent<React.ComponentType<any>>,
) {
  return (
    <ErrorBoundary onError={(error) => console.error("[Admin Route Error]:", error)}>
      <Component />
    </ErrorBoundary>
  );
}

export const adminRoutes = (
  <Route path="/admin">
    {/* Public routes */}
    <Route path="login" element={<AdminLogin />} />

    {/* Protected routes */}
    <Route element={<AdminProtectedRoute />}>
      <Route element={<AdminLayout />}>
        <Route index element={withErrorBoundary(AdminDashboard)} />
        <Route path="deposits" element={withErrorBoundary(AdminDeposits)} />
        <Route path="accounts" element={withErrorBoundary(AdminAccounts)} />
        <Route path="giftcodes" element={withErrorBoundary(AdminGiftcodes)} />
        <Route path="reviews" element={withErrorBoundary(AdminReviews)} />
        <Route path="reconciliation" element={withErrorBoundary(AdminReconciliation)} />
        <Route path="users" element={withErrorBoundary(AdminUserBalance)} />
        <Route path="audit-logs" element={withErrorBoundary(AdminAuditLogs)} />
        <Route path="orders" element={withErrorBoundary(AdminOrders)} />
        <Route path="analytics" element={withErrorBoundary(AdminAnalytics)} />
        <Route path="payment-monitoring" element={withErrorBoundary(AdminPaymentMonitoring)} />
        <Route path="config" element={withErrorBoundary(AdminConfig)} />
        <Route path="config/general" element={withErrorBoundary(AdminConfig)} />
        <Route path="config/banks" element={withErrorBoundary(AdminConfig)} />
        <Route path="config/cards" element={withErrorBoundary(AdminConfig)} />
        <Route path="config/ui" element={withErrorBoundary(AdminConfig)} />
        <Route path="admins" element={withErrorBoundary(AdminAdmins)} />
        <Route path="profile" element={withErrorBoundary(AdminProfile)} />
      </Route>
    </Route>
  </Route>
);
