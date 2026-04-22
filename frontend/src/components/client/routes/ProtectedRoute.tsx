import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, user, checkAuth, loading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!accessToken && !user && !loading) {
      checkAuth();
    }
  }, [accessToken, user, loading, checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Nếu chưa có token hoặc user → redirect về login
  // Lưu lại location hiện tại để sau khi login xong có thể quay lại đúng trang cũ
  if (!accessToken || !user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
