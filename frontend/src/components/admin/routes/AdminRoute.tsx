import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router";

interface AdminRouteProps {
  requireRole?: "super_admin" | "admin";
}

export const AdminRoute = ({ requireRole }: AdminRouteProps = {}) => {
  const { admin, isAuthenticated, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Chưa đăng nhập → redirect về login, lưu lại trang đang truy cập
  if (!isAuthenticated || !admin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  //Không đủ quyền (role không khớp) → redirect về dashboard
  if (
    requireRole &&
    admin.role !== requireRole &&
    admin.role !== "super_admin"
  ) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};
