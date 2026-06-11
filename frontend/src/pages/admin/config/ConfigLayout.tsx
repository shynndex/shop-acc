import { Outlet, NavLink } from "react-router-dom";
import { PageHeader } from "@/components/admin/shared";
import { cn } from "@/lib/utils";
import {
  Settings,
  CreditCard,
  Gamepad2,
  Phone,
  MessageCircle,
  Search,
  Palette,
  Gift,
} from "lucide-react";

const configNav = [
  { label: "Chung", to: "/admin/config", icon: Settings, end: true },
  { label: "Ngân hàng", to: "/admin/config/banks", icon: CreditCard },
  { label: "Thẻ cào", to: "/admin/config/cards", icon: CreditCard },
  { label: "Liên hệ", to: "/admin/config/contact", icon: Phone },
  { label: "Kênh hỗ trợ", to: "/admin/config/support", icon: MessageCircle },
  { label: "SEO", to: "/admin/config/seo", icon: Search },
  { label: "Màu sắc", to: "/admin/config/theme", icon: Palette },
  { label: "Giao diện", to: "/admin/config/ui", icon: Gamepad2 },
  { label: "Khuyến mãi", to: "/admin/config/promotions", icon: Gift },
];

const ConfigLayout = () => {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Cấu hình hệ thống"
        description="Quản lý cấu hình chung, ngân hàng, thẻ cào và giao diện"
      />
      {/* Tab navigation */}
      <nav className="flex flex-wrap gap-1 border-b border-border/50 pb-2">
        {configNav.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )
            }
          >
            <Icon className="size-3.5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
};

export default ConfigLayout;
