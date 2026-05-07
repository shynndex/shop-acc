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
import { AlertTriangle, CreditCard, TrendingUp, Users } from "lucide-react";

export default function Dashboard() {
  //mocks
  const stats = [
    {
      title: "Doanh thu hôm nay",
      value: "12.450.000đ",
      change: "+12.5%",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Giao dịch chờ",
      value: "23",
      change: "Cần xử lý",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      title: "Tổng user",
      value: "1.234",
      change: "+5 hôm nay",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Tỷ lệ thành công",
      value: "94.2%",
      change: "+2.1%",
      icon: CreditCard,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
    </div>
  );
}
