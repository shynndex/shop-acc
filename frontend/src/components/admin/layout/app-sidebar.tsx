"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Blend,
  CreditCard,
  History,
  LayoutDashboard,
  MessageSquareText,
  ShoppingCart,
  PieChart,
  TrendingUp,
  Settings,
  ShieldCheck,
  Tag,
  User,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { useAdminAuth } from "@/stores/useAdminAuth";

// ── Nav item shape with optional role requirement ─────────────────────
type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  minRole?: "admin" | "super_admin"; // minimum role required to see this item
  items?: { title: string; url: string; minRole?: "admin" | "super_admin" }[];
};

const allNavItems: NavItem[] = [
  { title: "Tổng quan", url: "/admin", icon: LayoutDashboard, minRole: "admin" },
  { title: "Đơn hàng", url: "/admin/orders", icon: ShoppingCart, minRole: "admin" },
  { title: "Giao dịch nạp tiền", url: "/admin/deposits", icon: CreditCard, minRole: "admin" },
  { title: "Tài khoản", url: "/admin/accounts", icon: User, minRole: "admin" },
  { title: "Phân tích", url: "/admin/analytics", icon: TrendingUp, minRole: "admin" },
  { title: "Đối soát", url: "/admin/reconciliation", icon: PieChart, minRole: "admin" },
  { title: "Giám sát TT", url: "/admin/payment-monitoring", icon: Activity, minRole: "admin" },
  { title: "Mã giảm giá", url: "/admin/giftcodes", icon: Tag, minRole: "admin" },
  { title: "Đánh giá", url: "/admin/reviews", icon: MessageSquareText, minRole: "admin" },
  { title: "Người dùng", url: "/admin/users", icon: User, minRole: "admin" },
  {
    title: "Cấu hình", url: "/admin/config", icon: Settings, minRole: "admin",
    items: [
      { title: "Chung", url: "/admin/config/general", minRole: "admin" },
      { title: "Ngân hàng", url: "/admin/config/banks", minRole: "admin" },
      { title: "Thẻ cào", url: "/admin/config/cards", minRole: "admin" },
      { title: "Giao diện", url: "/admin/config/ui", minRole: "super_admin" },
    ],
  },
  { title: "Nhật ký hoạt động", url: "/admin/audit-logs", icon: History, minRole: "admin" },
  { title: "Quản trị viên", url: "/admin/admins", icon: ShieldCheck, minRole: "super_admin" },
];

// Role hierarchy (higher index = more privileges)
const ROLE_LEVELS: Record<string, number> = {
  admin: 0,
  super_admin: 1,
};

function hasAccess(userRole: string | undefined, minRole: string | undefined): boolean {
  if (!minRole) return true;
  if (!userRole) return false;
  return (ROLE_LEVELS[userRole] ?? -1) >= (ROLE_LEVELS[minRole] ?? 0);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { admin } = useAdminAuth();
  const userRole = admin?.role;

  // Filter nav items by role; hide parent if all sub-items are filtered out
  const navItems = allNavItems
    .filter((item) => {
      if (!hasAccess(userRole, item.minRole)) return false;
      if (item.items) {
        // Keep parent only if at least one sub-item remains
        return item.items.some((sub) => hasAccess(userRole, sub.minRole));
      }
      return true;
    })
    .map(({ minRole: _mr, ...rest }) => ({
      ...rest,
      items: rest.items?.filter((sub) => hasAccess(userRole, sub.minRole)),
    }));

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5!"
              >
                <Link to="/admin">
                  <Blend className="size-5!" />
                  <span className="text-base font-semibold">Acme Inc.</span>
                </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
