import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KpiMetric } from "@/types/admin/analytics.type";
import * as Icons from "lucide-react";
import React from "react";

interface KpiCardProps {
  metric: KpiMetric;
  className?: string;
}

const KpiCard = ({ metric, className }: KpiCardProps) => {
  const Icon = metric.icon
    ? (Icons[metric.icon as keyof typeof Icons] as Icons.LucideIcon)
    : null;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {metric.label}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {metric.value}
          {metric.suffix && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {" "}
              {metric.suffix}
            </span>
          )}
        </div>

        {metric.change !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs mt-1 ${metric.trend === "up" ? "text-green-500" : metric.trend === "down" ? "text-red-600" : "text-muted-foreground"}`}
          >
            {metric.trend === "up" ? (
              <Icons.ArrowUp className="h-4 w-4" />
            ) : (
              <Icons.ArrowDown className="h-4 w-4" />
            )}
            <span>{Math.abs(metric.change)}% so với kỳ trước</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KpiCard;
