import { CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import type { KpiMetric } from "@/types/admin/analytics.type";
import { ArrowUp, ArrowDown, Minus, DollarSign, ShoppingCart, Users, Gamepad2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  metric: KpiMetric;
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  ShoppingCart,
  Users,
  Gamepad2,
};

const colorMap: Record<string, string> = {
  DollarSign: "bg-green-100 text-green-700",
  ShoppingCart: "bg-blue-100 text-blue-700",
  Users: "bg-purple-100 text-purple-700",
  Gamepad2: "bg-amber-100 text-amber-700",
};

const KpiCard = ({ metric, className }: KpiCardProps) => {
  const Icon = metric.icon ? iconMap[metric.icon] : undefined;
  const colorClass = (metric.icon && colorMap[metric.icon]) || "bg-muted text-muted-foreground";

  return (
    <GlassCard className={cn("hover:shadow-md transition-all duration-200 hover:-translate-y-0.5", className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div
                className={cn(
                  "size-8 sm:size-10 rounded-lg flex items-center justify-center shrink-0",
                  colorClass,
                )}
              >
                <Icon className="size-4 sm:size-5" />
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight break-all sm:break-normal">
                {typeof metric.value === "number"
                  ? metric.suffix === "đ"
                    ? `${metric.value.toLocaleString("vi-VN")}${metric.suffix}`
                    : metric.value.toLocaleString("vi-VN")
                  : metric.value}
                {metric.suffix && metric.suffix !== "đ" && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {metric.suffix}
                  </span>
                )}
              </p>
            </div>
          </div>

          {metric.change !== undefined && (
            <div className="flex items-center gap-1 shrink-0">
              {metric.trend === "up" ? (
                <ArrowUp className="size-4 text-green-500" />
              ) : metric.trend === "down" ? (
                <ArrowDown className="size-4 text-red-500" />
              ) : (
                <Minus className="size-4 text-muted-foreground" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  metric.trend === "up"
                    ? "text-green-600"
                    : metric.trend === "down"
                      ? "text-red-600"
                      : "text-muted-foreground",
                )}
              >
                {metric.change > 0 ? "+" : ""}
                {metric.change}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </GlassCard>
  );
};

export default KpiCard;
