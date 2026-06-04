import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, user, checkAuth, loading } = useAuthStore();

  // Nếu có token nhưng chưa có user data (persist chưa hydrate), thử load
  useEffect(() => {
    if (accessToken && !user) {
      checkAuth();
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (accessToken && user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
