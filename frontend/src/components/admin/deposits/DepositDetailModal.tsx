// src/components/admin/deposits/DepositDetailModal.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Banknote,
  Calendar,
  Check,
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
  User,
  X,
} from "lucide-react";
import type { Deposit } from "@/types/admin/deposit.type";
import { formatVND } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface DepositDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deposit: Deposit | null;
  onUpdateStatus: (
    id: string,
    status: "PAID" | "FAILED" | "CANCELLED",
    note?: string,
  ) => Promise<void>;
  loading?: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700",
  PAID: "bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700",
  SUCCESS: "bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700",
  FAILED: "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700",
  CANCELLED: "bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PAID: "Đã thanh toán",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
};

export function DepositDetailModal({
  open,
  onOpenChange,
  deposit,
  onUpdateStatus,
  loading = false,
}: DepositDetailModalProps) {
  const [adminNote, setAdminNote] = useState(deposit?.adminNote || "");
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset form khi modal mở/đóng hoặc deposit thay đổi
  useEffect(() => {
    if (open && deposit) {
      setAdminNote(deposit.adminNote || "");
    }
  }, [open, deposit]);

  if (!deposit) return null;

  const handleApprove = async () => {
    if (!confirm("Bạn có chắc muốn DUYỆT giao dịch này?")) return;
    setIsProcessing(true);
    try {
      await onUpdateStatus(deposit._id, "PAID", adminNote);
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Lý do từ chối (optional):") || "Từ chối bởi admin";
    if (!confirm(`Bạn có chắc muốn TỪ CHỐI giao dịch này?\nLý do: ${reason}`))
      return;
    setIsProcessing(true);
    try {
      await onUpdateStatus(deposit._id, "FAILED", reason);
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Bạn có chắc muốn HỦY giao dịch này?")) return;
    setIsProcessing(true);
    try {
      await onUpdateStatus(deposit._id, "CANCELLED", adminNote);
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Đã copy ${label}`);
    } catch (error) {
      toast.error(`Không thể copy ${label}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Chi tiết giao dịch</DialogTitle>
            <Badge className={`${statusColors[deposit.status]} text-white`}>
              {statusLabels[deposit.status] || deposit.status}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Mã giao dịch:{" "}
            <code className="bg-muted px-1 py-0.5 rounded">{deposit._id}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* === Basic Info === */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Người dùng
              </div>
              <div className="font-medium">
                {deposit.userUsername || "N/A"}
                {deposit.userEmail && (
                  <div className="text-xs text-muted-foreground">
                    {deposit.userEmail}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Thời gian
              </div>
              <div className="font-medium text-sm">
                {formatDate(deposit.createdAt)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Banknote className="h-4 w-4" />
                Loại giao dịch
              </div>
              <Badge
                variant={deposit.type === "bank" ? "default" : "secondary"}
              >
                {deposit.type === "bank" ? "Chuyển khoản" : "Thẻ cào"}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Số tiền
              </div>
              <div className="font-semibold text-green-600">
                {formatVND(deposit.amount)}đ
                {deposit.fee !== undefined && deposit.fee > 0 && (
                  <span className="text-xs text-muted-foreground font-normal ml-1">
                    (phí: {formatVND(deposit.fee)}đ)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* === Type-specific Details === */}
          <div className="space-y-4">
            {deposit.type === "bank" && deposit.bankInfo && (
              <div className="space-y-3 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center gap-2 text-blue-700 font-medium">
                  <Banknote className="h-4 w-4" />
                  Thông tin chuyển khoản
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Ngân hàng
                    </Label>
                    <div className="font-medium">
                      {deposit.bankInfo.bankName || "N/A"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Số tài khoản
                    </Label>
                    <div className="font-mono">
                      {deposit.bankInfo.accountNumber || "N/A"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Chủ tài khoản
                    </Label>
                    <div>{deposit.bankInfo.accountHolder || "N/A"}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Mã tham chiếu
                    </Label>
                    <div className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {deposit.bankInfo.referenceCode || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {deposit.type === "card" && deposit.cardInfo && (
              <div className="space-y-3 p-4 border rounded-lg bg-purple-50/50 border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 font-medium">
                  <CreditCard className="h-4 w-4" />
                  Thông tin thẻ cào
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Nhà cung cấp
                    </Label>
                    <div className="font-medium">
                      {deposit.cardInfo.provider || "N/A"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Mệnh giá khai báo
                    </Label>
                    <div>{formatVND(deposit.cardInfo.declaredValue || 0)}đ</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Số tiền thực nhận
                    </Label>
                    <div className="font-semibold text-green-600">
                      {formatVND(deposit.cardInfo.receivedValue || 0)}đ
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Serial
                    </Label>
                    <div className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                      {deposit.cardInfo.serial || "N/A"}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">PIN</Label>
                    <div
                      className="font-mono text-sm bg-muted px-2 py-1 rounded inline-block cursor-pointer"
                      onClick={() =>
                        copyToClipboard(deposit.cardInfo?.pin || "N/A", "PIN")
                      }
                    >
                      {deposit.cardInfo.pin?.replace(/.(?=.{4})/g, "*") ||
                        "N/A"}
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      (hiển thị masked, click để copy full)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* === Admin Note === */}
          <div className="space-y-2">
            <Label htmlFor="adminNote" className="flex items-center gap-2">
              <FileText className="size-4" />
              Ghi chú admin
            </Label>
            <Textarea
              id="adminNote"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Nhập ghi chú nội bộ (không hiển thị cho user)..."
              rows={3}
              disabled={loading || isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Ghi chú này chỉ admin xem được, dùng để lưu lý do duyệt/từ chối.
            </p>
          </div>
        </div>

        {/* === Footer Actions === */}
        <DialogFooter className="pt-4 border-t flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || isProcessing}
          >
            <X className="mr-2 h-4 w-4" />
            Đóng
          </Button>

          {deposit.status === "PENDING" && (
            <>
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancel}
                disabled={loading || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Hủy
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleReject}
                disabled={loading || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="mr-2 h-4 w-4" />
                )}
                Từ chối
              </Button>
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={loading || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Duyệt giao dịch
              </Button>
            </>
          )}

          {deposit.status !== "PENDING" && (
            <p className="text-sm text-muted-foreground">
              Giao dịch đã được xử lý ({statusLabels[deposit.status]}).
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
