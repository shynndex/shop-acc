import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { AuditLog } from "@/types/admin/audit.type";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface AuditDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: AuditLog | null;
}

const actionLabels: Record<string, string> = {
  "account:create": "Tạo tài khoản",
  "account:update": "Cập nhật tài khoản",
  "account:toggle": "Ẩn/Hiện tài khoản",
  "account:delete": "Xóa tài khoản",
  "deposit:approve": "Duyệt nạp tiền",
  "deposit:reject": "Từ chối nạp tiền",
  "deposit:cancel": "Hủy giao dịch",
  "giftcode:create": "Tạo mã giảm giá",
  "giftcode:update": "Cập nhật mã",
  "giftcode:delete": "Xóa mã giảm giá",
  "review:approve": "Duyệt đánh giá",
  "review:reject": "Từ chối đánh giá",
  "balance:adjust": "Điều chỉnh số dư",
  "admin:login": "Đăng nhập",
  "admin:logout": "Đăng xuất",
};

const resourceLabels: Record<string, string> = {
  account: "Tài khoản game",
  deposit: "Nạp tiền",
  giftcode: "Mã giảm giá",
  review: "Đánh giá",
  user_balance: "Số dư người dùng",
  auth: "Xác thực",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground min-w-[120px]">{label}</span>
      <span className="text-sm font-medium text-right break-all max-w-[300px]">
        {value}
      </span>
    </div>
  );
}

export default function AuditDetailDialog({
  open,
  onOpenChange,
  log,
}: AuditDetailDialogProps) {
  if (!log) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(log._id);
    toast.success("Đã sao chép ID");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chi tiết nhật ký</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về hành động của quản trị viên
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between animate-in fade-in duration-300">
            <Badge variant="secondary" className="text-xs">
              {log._id.slice(-8)}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleCopyId} className="transition-all duration-150 hover:scale-105 active:scale-95">
              <Copy className="size-3 mr-1" />
              Copy ID
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: "50ms" }}>
              <DetailRow
                label="Thời gian"
                value={new Date(log.createdAt).toLocaleString("vi-VN")}
              />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: "100ms" }}>
              <DetailRow label="Quản trị viên" value={log.adminName || "N/A"} />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: "150ms" }}>
              <DetailRow
                label="Hành động"
                value={
                  <Badge variant="outline">
                    {actionLabels[log.action] || log.action}
                  </Badge>
                }
              />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: "200ms" }}>
              <DetailRow
                label="Tài nguyên"
                value={resourceLabels[log.resource] || log.resource}
              />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: "250ms" }}>
              <DetailRow
                label="ID tài nguyên"
                value={
                  log.resourceId ? (
                    <span className="font-mono text-xs">{log.resourceId}</span>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: "300ms" }}>
              <DetailRow label="IP" value={log.ip || "—"} />
            </div>
          </div>

          <Separator />

          <div className="animate-in fade-in duration-300" style={{ animationDelay: "350ms" }}>
            <h4 className="text-sm font-medium mb-2">Chi tiết bổ sung</h4>
            {log.details && Object.keys(log.details).length > 0 ? (
              <pre className="bg-muted rounded-md p-3 text-xs overflow-auto max-h-[200px] font-mono">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">Không có chi tiết</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
