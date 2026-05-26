import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReconKpi } from "@/types/admin/reconciliation.type";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, TrendingUp, TrendingDown, AlertTriangle, CreditCard, DollarSign, Percent, Wallet } from "lucide-react";

interface ReconKPICardsProps {
  kpis: Record<string, ReconKpi> | null | undefined;
  loading?: boolean;
}

const kpiIcons: Record<string, React.ElementType> = {
  totalDepositsToday: DollarSign,
  totalDepositsMonth: Wallet,
  successRateToday: Percent,
  totalRevenueToday: TrendingUp,
  totalRevenueMonth: TrendingDown,
  pendingAlertCount: AlertTriangle,
};

const kpiColors: Record<string, string> = {
  totalDepositsToday: "text-blue-600",
  totalDepositsMonth: "text-indigo-600",
  successRateToday: "text-green-600",
  totalRevenueToday: "text-emerald-600",
  totalRevenueMonth: "text-teal-600",
  pendingAlertCount: "text-orange-600",
};

export function ReconKPICards({ kpis, loading }: ReconKPICardsProps) {
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} size="sm">
            <CardHeader className="pb-2">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-7 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const entries = Object.entries(kpis);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {entries.map(([key, kpi]) => {
        const Icon = kpiIcons[key] || CreditCard;
        const colorClass = kpiColors[key] || "text-muted-foreground";

        return (
          <Card key={key} size="sm" className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {kpi.label}
              </CardTitle>
              <Icon className={cn("size-4", colorClass)} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">
                  {kpi.suffix === "%"
                    ? `${kpi.value}%`
                    : kpi.value.toLocaleString("vi-VN")}
                </span>
                {kpi.suffix !== "%" && (
                  <span className="text-xs text-muted-foreground">{kpi.suffix}</span>
                )}
              </div>
              {kpi.trend !== undefined && kpi.change !== undefined && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs mt-1",
                    kpi.trend === "up" ? "text-green-600" : "text-red-600",
                  )}
                >
                  {kpi.trend === "up" ? (
                    <ArrowUp className="size-3" />
                  ) : (
                    <ArrowDown className="size-3" />
                  )}
                  <span>{kpi.change}%</span>
                  {kpi.type === "warning" && kpi.value > 0 && (
                    <span className="ml-1 text-amber-600 font-medium">Cần xử lý</span>
                  )}
                  {kpi.type === "success" && (
                    <span className="ml-1 text-green-600 font-medium">Tốt</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
