import { useAdminAuth } from "@/stores/useAdminAuth";
import { useIdleTimer } from "@/hooks/useIdleTimer";
import { SessionTimeoutModal } from "@/components/admin/SessionTimeoutModal";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { toast } from "sonner";

interface AdminProtectedRouteProps {
  requireRole?: "super_admin" | "admin";
}

/**
 * IDLE_TIMEOUT — Thời gian inactive trước khi cảnh báo (25 phút)
 * Sau warning countdown (60s) → auto logout
 * Tổng ~26 phút inactive → auto logout
 */
const IDLE_TIMEOUT_MS = 25 * 60 * 1000; // 25 phút
const WARNING_BEFORE_MS = 60 * 1000; // 60 giây countdown

export const AdminProtectedRoute = ({ requireRole }: AdminProtectedRouteProps = {}) => {
  const { admin, isAuthenticated, loading, checkAuth, logout } = useAdminAuth();
  const location = useLocation();
  const [initializing, setInitializing] = useState(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // ─── Auth check on mount ──────────────────────────────────────────
  useEffect(() => {
    // If the admin was already authenticated via client signIn (login-form.tsx
    // directly populated the useAdminAuth store), skip the HTTP request and
    // just mark initialisation as complete. Subsequent API calls (fetching
    // accounts, deposits, etc.) will verify the cookie — if it fails, the
    // adminAxios interceptor will handle the 401 redirect to /admin/login.
    if (admin && isAuthenticated && !loading) {
      setInitializing(false);
      return;
    }
    checkAuth().finally(() => setInitializing(false));
  }, []);

  // ─── Idle timeout handlers ─────────────────────────────────────────
  const handleIdleWarning = useCallback(() => {
    setShowTimeoutWarning(true);
  }, []);

  const handleIdle = useCallback(() => {
    setShowTimeoutWarning(false);
    toast.error("Phiên làm việc đã hết hạn do không hoạt động.", {
      duration: 3000,
    });
    logout();
  }, [logout]);

  const handleActive = useCallback(() => {
    setShowTimeoutWarning(false);
  }, []);

  const handleExtendSession = useCallback(() => {
    setShowTimeoutWarning(false);
    toast.success("Đã gia hạn phiên làm việc", { duration: 2000 });
  }, []);

  const handleLogoutNow = useCallback(() => {
    setShowTimeoutWarning(false);
    toast.info("Đã đăng xuất", { duration: 2000 });
    logout();
  }, [logout]);

  // ─── Idle timer — chỉ active khi đã authenticated ──────────────────
  useIdleTimer({
    timeout: IDLE_TIMEOUT_MS,
    warningBefore: WARNING_BEFORE_MS,
    onWarning: handleIdleWarning,
    onIdle: handleIdle,
    onActive: handleActive,
    enabled: isAuthenticated && !initializing,
  });

  // ─── RENDER ──────────────────────────────────────────────────────────
  if (initializing || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Chưa đăng nhập → redirect login, lưu trang đang truy cập
  if (!isAuthenticated || !admin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Không đủ quyền → redirect dashboard
  if (
    requireRole &&
    admin.role !== requireRole &&
    admin.role !== "super_admin"
  ) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <>
      {/* Session timeout warning modal */}
      <SessionTimeoutModal
        open={showTimeoutWarning}
        countdown={60}
        onExtend={handleExtendSession}
        onLogout={handleLogoutNow}
      />

      <Outlet />
    </>
  );
};
