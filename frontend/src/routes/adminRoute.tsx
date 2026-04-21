import { lazy } from "react";
import { Route } from "react-router-dom";
import AdminLayout from "@/components/admin/layout/AdminLayout";
// import { ProtectedRoute } from "@/components/admin/routes/ProtectedRoute";

const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));

export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    {/* Thêm route admin khác tại đây khi phát triển */}
  </Route>
);