import { useAuthStore } from "@/stores/useAuthStore";
import { Navigate } from "react-router-dom";

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, user } = useAuthStore();

  if (accessToken && user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};