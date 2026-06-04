import {
  PageHeader,
} from "@/components/admin/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/glass-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Building,
  CreditCard,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Settings,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Palette,
  Gamepad2,
  Megaphone,
  ImageIcon,
  FileText,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bankAccountService,
  configService,
} from "@/services/admin/bankAccount.service";
import type {
  BankAccount,
  CreateBankAccountPayload,
  UpdateBankAccountPayload,
} from "@/types/admin/bankAccount.type";
import React, { useState, useCallback, lazy, Suspense } from "react";
import {
  Tabs as SubTabs,
  TabsContent as SubTabsContent,
  TabsList as SubTabsList,
  TabsTrigger as SubTabsTrigger,
} from "@/components/ui/tabs";
import { useAdminAuth } from "@/stores/useAdminAuth";
import { useNavigate, useLocation } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────
// Lazy-loaded UI Management Components
// ─────────────────────────────────────────────────────────────────
const LazyGameCategoryManager = lazy(() => import("@/components/admin/ui/GameCategoryManager"));
const LazyPopupManager = lazy(() => import("@/components/admin/ui/PopupManager"));
const LazyBannerManager = lazy(() => import("@/components/admin/ui/BannerManager"));
const LazyCmsPageManager = lazy(() => import("@/components/admin/ui/CmsPageManager"));

// ─────────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────────
const queryKeys = {
  banks: {
    all: ["admin", "banks"] as const,
    list: (params?: Record<string, any>) =>
      ["admin", "banks", "list", params] as const,
  },
  config: {
    general: ["admin", "config", "general"] as const,
    cardProviders: ["admin", "config", "card-providers"] as const,
  },
};

// ─────────────────────────────────────────────────────────────────
// Tab 1: General Settings
// ─────────────────────────────────────────────────────────────────
const GeneralSettings = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.config.general,
    queryFn: () => configService.getGeneral(),
  });

  const config = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Không thể tải cấu hình
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="size-4" />
            Thông tin chung
          </CardTitle>
          <CardDescription>
            Các cấu hình cơ bản của hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Tên trang</Label>
              <p className="text-sm font-medium mt-1">{config.siteName}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Frontend URL</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm bg-muted dark:bg-muted/50 px-2 py-0.5 rounded">
                  {config.frontendUrl}
                </code>
                <a
                  href={config.frontendUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
                </a>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                Nạp tối thiểu
              </Label>
              <p className="text-sm font-medium mt-1">
                {config.minDeposit.toLocaleString("vi-VN")}đ
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                Nạp tối đa
              </Label>
              <p className="text-sm font-medium mt-1">
                {config.maxDeposit.toLocaleString("vi-VN")}đ
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">
              Nhà mạng thẻ cào hỗ trợ
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {config.cardProviders.map((provider) => (
                <Badge key={provider} variant="secondary">
                  {provider}
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              <ShieldCheck className="size-3 inline mr-1" />
              Cấu hình có thể thay đổi qua file <code>.env</code> và cần khởi
              động lại server
            </p>
          </div>
        </CardContent>
      </GlassCard>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Bank Account Form Dialog
// ─────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// Bank Account Card Component
// ─────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// Tab 2: Bank Accounts
// ─────────────────────────────────────────────────────────────────
const BankAccountsTab = () => {
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {banks.length > 0
            ? `${banks.length} tài khoản ngân hàng`
            : "Chưa có tài khoản ngân hàng nào"}
        </p>
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

      {banks.length === 0 ? (
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
          {banks.map((bank) => (
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
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Tab 3: Card Provider Config
// ─────────────────────────────────────────────────────────────────
const CardProvidersTab = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.config.cardProviders,
    queryFn: () => configService.getCardProviders(),
  });

  const config = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Không thể tải cấu hình
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="size-4" />
            Cấu hình nhà cung cấp thẻ cào
          </CardTitle>
          <CardDescription>
            Thông tin cấu hình đối tác nạp thẻ cào
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              config.isConfigured
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
          >
            {config.isConfigured ? (
              <>
                <CheckCircle2 className="size-4" />
                Đã cấu hình
              </>
            ) : (
              <>
                <XCircle className="size-4" />
                Chưa cấu hình
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <Label className="text-sm text-muted-foreground">
                Partner ID
              </Label>
              <p className="text-sm font-mono mt-1 bg-muted dark:bg-muted/50 px-2 py-1 rounded">
                {config.partnerId}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                Base URL
              </Label>
              <p className="text-sm font-mono mt-1 bg-muted dark:bg-muted/50 px-2 py-1 rounded">
                {config.baseUrl}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">
              Nhà mạng hỗ trợ
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {config.providers.map((provider) => (
                <Badge key={provider} variant="secondary">
                  {provider}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">
              Cache fee TTL
            </Label>
            <p className="text-sm font-medium mt-1">{config.feeCacheTTL}</p>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              <ShieldCheck className="size-3 inline mr-1" />
              Thông tin nhà cung cấp được cấu hình qua file <code>.env</code>.
              Partner Key không được hiển thị vì lý do bảo mật.
            </p>
          </div>
        </CardContent>
      </GlassCard>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════
// Tab 4: UI Management (Giao diện) — with lazy-loaded sub-components
// ═════════════════════════════════════════════════════════════════════════
const UiManagementTab = () => {
  const [subTab, setSubTab] = useState("games");

  return (
    <div className="space-y-4">
      <SubTabs value={subTab} onValueChange={setSubTab} className="w-full">
        <SubTabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <SubTabsTrigger value="games" className="flex items-center gap-2">
            <Gamepad2 className="size-4" />
            <span>Danh mục game</span>
          </SubTabsTrigger>
          <SubTabsTrigger value="popups" className="flex items-center gap-2">
            <Megaphone className="size-4" />
            <span>Popup/Modal</span>
          </SubTabsTrigger>
          <SubTabsTrigger value="banners" className="flex items-center gap-2">
            <ImageIcon className="size-4" />
            <span>Banner</span>
          </SubTabsTrigger>
          <SubTabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="size-4" />
            <span>Trang nội dung</span>
          </SubTabsTrigger>
        </SubTabsList>

        <div className="mt-4">
          <SubTabsContent value="games">
            <Suspense fallback={
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            }>
              <LazyGameCategoryManager />
            </Suspense>
          </SubTabsContent>
          <SubTabsContent value="popups">
            <Suspense fallback={
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            }>
              <LazyPopupManager />
            </Suspense>
          </SubTabsContent>
          <SubTabsContent value="banners">
            <Suspense fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            }>
              <LazyBannerManager />
            </Suspense>
          </SubTabsContent>
          <SubTabsContent value="pages">
            <Suspense fallback={
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            }>
              <LazyCmsPageManager />
            </Suspense>
          </SubTabsContent>
        </div>
      </SubTabs>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════
// Main Config Page
// ═════════════════════════════════════════════════════════════════════════
const Config = () => {
  const { admin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = admin?.role === "super_admin";

  // Determine active tab from URL path
  const pathToTab: Record<string, string> = {
    "/admin/config/general": "general",
    "/admin/config/banks": "banks",
    "/admin/config/cards": "cards",
    "/admin/config/ui": "ui",
    "/admin/config": "general",
  };
  const initialTab = pathToTab[location.pathname] || "general";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Redirect non-super-admin users — must be in useEffect to avoid render-side effect
  React.useEffect(() => {
    if (!isSuperAdmin && activeTab === "ui") {
      setActiveTab("general");
    }
  }, [isSuperAdmin, activeTab]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Cấu hình hệ thống"
        description="Quản lý cấu hình chung, ngân hàng, thẻ cào và giao diện"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="size-4" />
            <span className="hidden sm:inline">Chung</span>
          </TabsTrigger>
          <TabsTrigger value="banks" className="flex items-center gap-2">
            <Building className="size-4" />
            <span className="hidden sm:inline">Ngân hàng</span>
          </TabsTrigger>
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <CreditCard className="size-4" />
            <span className="hidden sm:inline">Thẻ cào</span>
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="ui" className="flex items-center gap-2">
              <Palette className="size-4" />
              <span className="hidden sm:inline">Giao diện</span>
            </TabsTrigger>
          )}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="general">
            <GeneralSettings />
          </TabsContent>
          <TabsContent value="banks">
            <BankAccountsTab />
          </TabsContent>
          <TabsContent value="cards">
            <CardProvidersTab />
          </TabsContent>
          {isSuperAdmin && (
            <TabsContent value="ui">
              <UiManagementTab />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default Config;
