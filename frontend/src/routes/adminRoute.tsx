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
const ConfigLayout = lazy(() => import("@/pages/admin/config/ConfigLayout"));
const GeneralSettingsPage = lazy(() => import("@/pages/admin/config/GeneralSettingsPage"));
const BankAccountsPage = lazy(() => import("@/pages/admin/config/BankAccountsPage"));
const CardProvidersPage = lazy(() => import("@/pages/admin/config/CardProvidersPage"));
const UiManagementPage = lazy(() => import("@/pages/admin/config/UiManagementPage"));
const ContactPage = lazy(() => import("@/pages/admin/config/ContactPage"));
const SupportChannelsPage = lazy(() => import("@/pages/admin/config/SupportChannelsPage"));
const SeoPage = lazy(() => import("@/pages/admin/config/SeoPage"));
const ThemeColorsPage = lazy(() => import("@/pages/admin/config/ThemeColorsPage"));
const PromotionsPage = lazy(() => import("@/pages/admin/config/PromotionsPage"));
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
        <Route path="config" element={<ErrorBoundary onError={(error) => console.error("[Admin Route Error]:", error)}><ConfigLayout /></ErrorBoundary>}>
          <Route index element={withErrorBoundary(GeneralSettingsPage)} />
          <Route path="general" element={withErrorBoundary(GeneralSettingsPage)} />
          <Route path="banks" element={withErrorBoundary(BankAccountsPage)} />
          <Route path="cards" element={withErrorBoundary(CardProvidersPage)} />
          <Route path="contact" element={withErrorBoundary(ContactPage)} />
          <Route path="support" element={withErrorBoundary(SupportChannelsPage)} />
          <Route path="seo" element={withErrorBoundary(SeoPage)} />
          <Route path="theme" element={withErrorBoundary(ThemeColorsPage)} />
          <Route path="ui" element={withErrorBoundary(UiManagementPage)} />
          <Route path="promotions" element={withErrorBoundary(PromotionsPage)} />
        </Route>
        <Route path="admins" element={withErrorBoundary(AdminAdmins)} />
        <Route path="profile" element={withErrorBoundary(AdminProfile)} />
      </Route>
    </Route>
  </Route>
);
