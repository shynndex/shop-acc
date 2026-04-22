import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, user, checkAuth, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (accessToken && user) {
      checkAuth();
    }
  }, [accessToken, loading, checkAuth]);

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
