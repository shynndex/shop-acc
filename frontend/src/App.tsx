import { BrowserRouter, Route, Routes } from "react-router-dom";
import SignUpPage from "./pages/SignUpPage";
import { Toaster } from "sonner";
import HomePage from "./pages/HomePage";
import AppLayout from "./components/layout/AppLayout";
import { PublicRoute } from "./components/routes/PublicRoute";
import AccountDetailPage from "./pages/AccountDetailPage";
import ShopPage from "./pages/ShopPage";
import SignInPage from "./pages/SignInPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import UserProfilePage from "./pages/UserProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Routes>
          {/*public routes */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route
              path="signin"
              element={
                <PublicRoute>
                  <SignInPage />
                </PublicRoute>
              }
            />
            <Route
              path="signup"
              element={
                <PublicRoute>
                  <SignUpPage />
                </PublicRoute>
              }
            />

            <Route path="tai-khoan">
              {/* 1. Trang danh sách: /tai-khoan/:categorySlug */}
              {/* Ví dụ: /tai-khoan/acc-lien-quan-trang-thong-tin */}
              <Route path=":categorySlug" element={<ShopPage />} />

              {/* 2. Trang chi tiết: /tai-khoan/:categorySlug/:id */}
              {/* Ví dụ: /tai-khoan/acc-lien-quan-trang-thong-tin/123456 */}
              <Route path=":categorySlug/:id" element={<AccountDetailPage />} />
            </Route>

            <Route path="me">
              <Route index element={<UserProfilePage />} />
              <Route path="orders" element={<OrderHistoryPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
export default App;
