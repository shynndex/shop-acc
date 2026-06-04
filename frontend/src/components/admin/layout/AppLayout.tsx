import { Outlet, useLocation, Link } from "react-router-dom";

import { AppSidebar } from "@/components/admin/layout/app-sidebar";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Separator } from "@/components/ui/separator";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { TooltipProvider } from "@/components/ui/tooltip";

import { ErrorBoundary } from "@/components/ui/error-boundary";

const breadcrumbLabels: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/orders": "Đơn hàng",
  "/admin/deposits": "Giao dịch nạp tiền",
  "/admin/analytics": "Phân tích",
  "/admin/reconciliation": "Đối soát",
  "/admin/payment-monitoring": "Giám sát TT",
  "/admin/giftcodes": "Mã giảm giá",
  "/admin/reviews": "Đánh giá",
  "/admin/users": "Người dùng",
  "/admin/accounts": "Tài khoản",
  "/admin/audit-logs": "Nhật ký hoạt động",
  "/admin/config": "Cấu hình",
  "/admin/config/general": "Cấu hình chung",
  "/admin/config/banks": "Cấu hình ngân hàng",
  "/admin/config/cards": "Cấu hình thẻ cào",
  "/admin/admins": "Quản trị viên",
  "/admin/profile": "Thông tin cá nhân",
};

export default function AdminLayout() {
  const location = useLocation();
  const currentLabel = breadcrumbLabels[location.pathname] || "Dashboard";

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 bg-background/80 backdrop-blur-sm px-4 sm:px-6">
            <SidebarTrigger className="-ml-1" />

            <Separator
              orientation="vertical"
              className="mr-2 h-4"
            />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link to="/admin" />}>
                    Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator />

                <BreadcrumbItem>
                  <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <main className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
            <ErrorBoundary resetKey={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}