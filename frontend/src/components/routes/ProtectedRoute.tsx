import { useAuthStore } from "@/stores/useAuthStore";
import { Navigate, useLocation } from "react-router";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, user } = useAuthStore();
  const location = useLocation();

  // Nếu chưa có token hoặc user → redirect về login
  // Lưu lại location hiện tại để sau khi login xong có thể quay lại đúng trang cũ

  if (!accessToken || !user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }
  

  return <>{children}</>;
};
