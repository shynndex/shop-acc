import { useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Building,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bankAccountService,
} from "@/services/admin/bankAccount.service";
import type {
  BankAccount,
  CreateBankAccountPayload,
  UpdateBankAccountPayload,
} from "@/types/admin/bankAccount.type";
import React from "react";

const queryKeys = {
  banks: {
    all: ["admin", "banks"] as const,
    list: (params?: Record<string, any>) =>
      ["admin", "banks", "list", params] as const,
  },
};

// ─── Bank Account Form Dialog ───────────────────────────────────────
interface BankFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: BankAccount | null;
  onSuccess: () => void;
}

const BankFormDialog = ({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: BankFormDialogProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [accountNumber, setAccountNumber] = useState(
    initialData?.accountNumber || "",
  );
  const [accountName, setAccountName] = useState(
    initialData?.accountName || "",
  );
  const [qrImageUrl, setQrImageUrl] = useState(initialData?.qrImageUrl || "");

  const createMutation = useMutation({
    mutationFn: (payload: CreateBankAccountPayload) =>
      bankAccountService.create(payload),
    onSuccess: () => {
      toast.success("Đã thêm ngân hàng thành công");
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBankAccountPayload }) =>
      bankAccountService.update(id, payload),
    onSuccess: () => {
      toast.success("Đã cập nhật ngân hàng thành công");
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !accountNumber.trim() || !accountName.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    const payload: CreateBankAccountPayload = {
      name: name.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      qrImageUrl: qrImageUrl.trim() || undefined,
    };

    if (initialData?._id) {
      updateMutation.mutate({ id: initialData._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAccountNumber(initialData.accountNumber);
      setAccountName(initialData.accountName);
      setQrImageUrl(initialData.qrImageUrl || "");
    } else {
      setName("");
      setAccountNumber("");
      setAccountName("");
      setQrImageUrl("");
    }
  }, [initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Sửa ngân hàng" : "Thêm ngân hàng"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Cập nhật thông tin ngân hàng"
              : "Thêm tài khoản ngân hàng mới cho hệ thống"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Tên ngân hàng</Label>
            <Input
              id="name"
              placeholder="VD: MB Bank, Vietcombank..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="accountNumber">Số tài khoản</Label>
            <Input
              id="accountNumber"
              placeholder="VD: 1234567890"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="accountName">Chủ tài khoản</Label>
            <Input
              id="accountName"
              placeholder="VD: NGUYEN VAN A"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qrImageUrl">QR Code URL (tuỳ chọn)</Label>
            <Input
              id="qrImageUrl"
              placeholder="https://..."
              value={qrImageUrl}
              onChange={(e) => setQrImageUrl(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {initialData ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Bank Account Card ──────────────────────────────────────────────
interface BankCardProps {
  bank: BankAccount;
  onToggleActive: (id: string) => void;
  onEdit: (bank: BankAccount) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
}

const BankCard = ({
  bank,
  onToggleActive,
  onEdit,
  onDelete,
  isToggling,
}: BankCardProps) => {
  return (
    <Card
      className={`relative transition-all duration-200 ${
        bank.isActive ? "ring-2 ring-primary/30 border-primary" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-lg flex items-center justify-center ${
                bank.isActive
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Building className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">{bank.name}</CardTitle>
              <CardDescription className="text-xs">
                {bank.isActive ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="size-3" />
                    Đang hoạt động
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <XCircle className="size-3" />
                    Không hoạt động
                  </span>
                )}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onEdit(bank)}
              title="Sửa"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm("Xoá ngân hàng này?")) onDelete(bank._id);
              }}
              title="Xoá"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Số tài khoản</span>
            <span className="font-mono font-medium">{bank.accountNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Chủ tài khoản</span>
            <span className="font-medium">{bank.accountName}</span>
          </div>
          {bank.qrImageUrl && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">QR Code</span>
              <a
                href={bank.qrImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Xem <ExternalLink className="size-3" />
              </a>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t">
          <Button
            variant={bank.isActive ? "outline" : "default"}
            size="sm"
            className="w-full"
            disabled={isToggling}
            onClick={() => onToggleActive(bank._id)}
          >
            {isToggling ? (
              <Loader2 className="mr-2 size-3 animate-spin" />
            ) : bank.isActive ? (
              <XCircle className="mr-2 size-3.5" />
            ) : (
              <CheckCircle2 className="mr-2 size-3.5" />
            )}
            {bank.isActive ? "Huỷ kích hoạt" : "Đặt làm ngân hàng chính"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────
const BankAccountsPage = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.banks.list(),
    queryFn: () => bankAccountService.list(),
  });

  const banks = data?.data?.banks || [];

  const toggleMutation = useMutation({
    mutationFn: (id: string) => bankAccountService.toggleActive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.banks.all });
      toast.success("Đã thay đổi trạng thái ngân hàng");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bankAccountService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.banks.all });
      toast.success("Đã xoá ngân hàng");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    },
  });

  const handleEdit = useCallback((bank: BankAccount) => {
    setEditingBank(bank);
    setShowForm(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingBank(null);
    setShowForm(true);
  }, []);

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.banks.all });
  }, [qc]);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Building className="size-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold">Tài khoản ngân hàng</h3>
          <p className="text-sm text-muted-foreground">Quản lý tài khoản ngân hàng nhận nạp tiền</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="mr-2 size-3.5" />
            Làm mới
          </Button>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="mr-2 size-3.5" />
            Thêm ngân hàng
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : banks.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/30">
          <Building className="size-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">
            Chưa có tài khoản ngân hàng nào
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Thêm tài khoản ngân hàng để người dùng có thể nạp tiền
          </p>
          <Button variant="outline" className="mt-4" onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            Thêm ngân hàng đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banks.map((bank: BankAccount) => (
            <BankCard
              key={bank._id}
              bank={bank}
              onToggleActive={(id) => toggleMutation.mutate(id)}
              onEdit={handleEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
              isToggling={toggleMutation.isPending}
            />
          ))}
        </div>
      )}

      <BankFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        initialData={editingBank}
        onSuccess={() =>
          qc.invalidateQueries({ queryKey: queryKeys.banks.all })
        }
      />
    </GlassCard>
  );
};

export default BankAccountsPage;
