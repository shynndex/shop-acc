import { lazy } from "react";
import { Route } from "react-router-dom";
import AppLayout from "@/components/client/layout/AppLayout";
import { PublicRoute } from "@/components/client/routes/PublicRoute";

// ⚡ Lazy load để tối ưu bundle size
const HomePage = lazy(() => import("@/pages/client/HomePage"));
const SignInPage = lazy(() => import("@/pages/client/SignInPage"));
const SignUpPage = lazy(() => import("@/pages/client/SignUpPage"));
const ShopPage = lazy(() => import("@/pages/client/ShopPage"));
const AccountDetailPage = lazy(() => import("@/pages/client/AccountDetailPage"));
const UserProfilePage = lazy(() => import("@/pages/client/UserProfilePage"));
const OrderHistoryPage = lazy(() => import("@/pages/client/OrderHistoryPage"));

export const clientRoutes = (
  <Route path="/" element={<AppLayout />}>
    <Route index element={<HomePage />} />

    <Route path="signin" element={<PublicRoute><SignInPage /></PublicRoute>} />
    <Route path="signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />

    <Route path="tai-khoan">
      <Route path=":categorySlug" element={<ShopPage />} />
      <Route path=":categorySlug/:id" element={<AccountDetailPage />} />
    </Route>

    <Route path="me">
      <Route index element={<UserProfilePage />} />
      <Route path="orders" element={<OrderHistoryPage />} />
    </Route>
  </Route>
);