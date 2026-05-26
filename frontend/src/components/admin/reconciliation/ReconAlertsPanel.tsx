import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatVND } from "@/lib/utils";
import type { ReconAlert } from "@/types/admin/reconciliation.type";
import { AlertTriangle, Ban, Clock, TimerOff } from "lucide-react";

interface ReconAlertsPanelProps {
  alerts: ReconAlert[];
  counts: { total: number; critical: number; warning: number };
  loading?: boolean;
}

const severityConfig = {
  critical: {
    icon: TimerOff,
    label: "Nghiêm trọng",
    className: "bg-red-50 border-red-200 text-red-800",
    badge: "destructive",
  },
  warning: {
    icon: Clock,
    label: "Cảnh báo",
    className: "bg-amber-50 border-amber-200 text-amber-800",
    badge: "warning",
  },
  info: {
    icon: AlertTriangle,
    label: "Thông tin",
    className: "bg-blue-50 border-blue-200 text-blue-800",
    badge: "default",
  },
};

const alertTypeIcons: Record<string, React.ElementType> = {
  stale_bank_deposit: Ban,
  stale_card_deposit: TimerOff,
  amount_mismatch: AlertTriangle,
};

export function ReconAlertsPanel({ alerts, counts, loading }: ReconAlertsPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-muted-foreground" />
            Cảnh báo đối soát
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm font-medium">Không có cảnh báo</p>
              <p className="text-xs mt-1">Tất cả giao dịch đang hoạt động bình thường</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-muted-foreground" />
            Cảnh báo đối soát
          </span>
          <div className="flex items-center gap-2">
            {counts.critical > 0 && (
              <Badge variant="destructive">{counts.critical} nghiêm trọng</Badge>
            )}
            {counts.warning > 0 && (
              <Badge variant="secondary">{counts.warning} cảnh báo</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const sev = severityConfig[alert.severity];
          const Icon = alertTypeIcons[alert.type] || AlertTriangle;

          return (
            <div
              key={`${alert.type}-${alert.depositId}`}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3",
                sev.className,
              )}
            >
              <Icon className="size-5 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{alert.message}</p>
                  <Badge variant={sev.badge as "destructive" | "default" | "secondary"} className="shrink-0 text-[10px] px-1.5 py-0">
                    {sev.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs opacity-80">
                  <span>Người dùng: {alert.user}</span>
                  <span>•</span>
                  <span>{alert.ageMinutes} phút</span>
                  {alert.type === "amount_mismatch" && alert.declaredValue && alert.receivedAmount && (
                    <>
                      <span>•</span>
                      <span>
                        Khai báo: {formatVND(alert.declaredValue)}đ → Thực nhận: {formatVND(alert.receivedAmount)}đ
                      </span>
                    </>
                  )}
                  {alert.referenceCode && (
                    <>
                      <span>•</span>
                      <span>Mã TK: {alert.referenceCode}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
