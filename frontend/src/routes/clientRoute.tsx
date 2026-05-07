import { lazy } from "react";
import { Route } from "react-router-dom";
import AppLayout from "@/components/client/layout/AppLayout";
import { PublicRoute } from "@/components/client/routes/PublicRoute";

// ⚡ Lazy load để tối ưu bundle size
const HomePage = lazy(() => import("@/pages/HomePage"));
const SignInPage = lazy(() => import("@/pages/SigninPage"));
const SignUpPage = lazy(() => import("@/pages/SignUpPage"));
const ShopPage = lazy(() => import("@/pages/ShopPage"));
const AccountDetailPage = lazy(() => import("@/pages/AccountDetailPage"));
const UserProfilePage = lazy(() => import("@/pages/UserProfilePage"));
const OrderHistoryPage = lazy(() => import("@/pages/OrderHistoryPage"));

export const clientRoutes = (
  <Route path="/" element={<AppLayout />}>
    <Route index element={<HomePage />} />

    {/* Public routes */}
    <Route path="signin" element={<PublicRoute><SignInPage /></PublicRoute>} />
    <Route path="signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />

      
    <Route path="tai-khoan">
      <Route path=":categorySlug" element={<ShopPage />} />
      <Route path=":categorySlug/:id" element={<AccountDetailPage />} />
    </Route>

     <Route path="me"> {/* bổ sung thêm protected route */}
      <Route index element={<UserProfilePage />} />
      <Route path="orders" element={<OrderHistoryPage />} />
    </Route>
  </Route>
);
