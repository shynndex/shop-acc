"use client";

import * as React from "react";
import {
  AudioWaveform,
  Blend,
  BookOpen,
  Bot,
  Command,
  CreditCard,
  Frame,
  GalleryVerticalEnd,
  LayoutDashboard,
  Map,
  MessageSquareText,
  PieChart,
  Settings,
  Settings2,
  ShieldCheck,
  SquareTerminal,
  Tag,
  User,
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

const adminNav = [
  {
    title: "Tổng quan",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Giao dịch nạp tiền",
    url: "/admin/deposits",
    icon: CreditCard,
  },
  {
    title: "Đối soát",
    url: "/admin/reconciliation",
    icon: PieChart,
  },
  {
    title: "Mã giảm giá",
    url: "/admin/giftcodes",
    icon: Tag,
  },
  {
    title: "Đánh giá",
    url: "/admin/reviews",
    icon: MessageSquareText,
  },
  {
    title: "Người dùng",
    url: "/admin/users",
    icon: User,
  },
  {
    title: "Cấu hình",
    url: "/admin/config",
    icon: Settings,
    items: [
      { title: "Chung", url: "/admin/config/general" },
      { title: "Ngân hàng", url: "/admin/config/banks" },
      { title: "Thẻ cào", url: "/admin/config/cards" },
    ],
  },
  {
    title: "Tài khoản",
    url: "/admin/accounts",
    icon: User,
  },
];

const superAdminNav = [
  {
    title: "Quản trị viên",
    url: "/admin/admins",
    icon: ShieldCheck,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { admin } = useAdminAuth();

  const isSuperAdmin = admin?.role === "super_admin";

  const navItems = isSuperAdmin ? [...adminNav, ...superAdminNav] : adminNav;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <Blend className="size-5!" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
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
