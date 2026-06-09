import {
  DataTable,
  PageHeader,
  SearchBar,
} from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminManagementService } from "@/services/admin/admin.service";
import type {
  AdminListItem,
  CreateAdminPayload,
  UpdateAdminPayload,
} from "@/types/admin/admin.type";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ShieldCheck,
  Shield,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import React, { useState, useCallback, useMemo } from "react";

// ─── Query Keys ─────────────────────────────────────────────────────────
const queryKeys = {
  admins: {
    all: ["admin", "admins"] as const,
    list: (params?: Record<string, any>) =>
      ["admin", "admins", "list", params] as const,
  },
};

// ─── Form Dialog ────────────────────────────────────────────────────────
interface AdminFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AdminListItem | null;
  onSuccess: () => void;
}

const AdminFormDialog = ({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: AdminFormDialogProps) => {
  const [username, setUsername] = useState(initialData?.username || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">(
    initialData?.role || "admin",
  );

  const createMutation = useMutation({
    mutationFn: (payload: CreateAdminPayload) =>
      adminManagementService.create(payload),
    onSuccess: () => {
      toast.success("Đã thêm quản trị viên thành công");
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAdminPayload;
    }) => adminManagementService.update(id, payload),
    onSuccess: () => {
      toast.success("Đã cập nhật quản trị viên thành công");
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  React.useEffect(() => {
    if (initialData) {
      setUsername(initialData.username);
      setEmail(initialData.email);
      setRole(initialData.role);
      setPassword("");
    } else {
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("admin");
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim()) {
      toast.error("Vui lòng nhập tên đăng nhập và email");
      return;
    }

    if (!initialData && !password) {
      toast.error("Vui lòng nhập mật khẩu");
      return;
    }

    if (initialData) {
      const payload: UpdateAdminPayload = {
        username: username.trim(),
        email: email.trim(),
        role,
      };
      updateMutation.mutate({ id: initialData._id, payload });
    } else {
      const payload: CreateAdminPayload = {
        username: username.trim(),
        email: email.trim(),
        password,
        role,
      };
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Sửa quản trị viên" : "Thêm quản trị viên"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Cập nhật thông tin quản trị viên"
              : "Tạo tài khoản quản trị viên mới"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="username">Tên đăng nhập</Label>
            <Input
              id="username"
              placeholder="VD: admin01"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {!initialData && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!initialData}
                minLength={6}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="role">Vai trò</Label>
            <Select
              value={role}
              onValueChange={(v: "admin" | "super_admin") => setRole(v)}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <Shield className="size-4" />
                  Admin
                </SelectItem>
                <SelectItem value="super_admin">
                  <ShieldCheck className="size-4" />
                  Super Admin
                </SelectItem>
              </SelectContent>
            </Select>
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
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {initialData ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Columns ────────────────────────────────────────────────────────────
const useAdminColumns = (
  onEdit: (admin: AdminListItem) => void,
  onToggle: (id: string) => void,
  onDelete: (id: string) => void,
) => {
  const columns = useMemo<ColumnDef<AdminListItem>[]>(
    () => [
      {
        accessorKey: "username",
        header: "Tên đăng nhập",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary uppercase">
                {row.original.username.charAt(0)}
              </span>
            </div>
            <div>
              <span className="font-medium">{row.original.username}</span>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Vai trò",
        cell: ({ row }) => {
          const isSuperAdmin = row.original.role === "super_admin";
          return (
            <Badge
              variant={isSuperAdmin ? "default" : "secondary"}
              className="gap-1"
            >
              {isSuperAdmin ? (
                <ShieldCheck className="size-3" />
              ) : (
                <Shield className="size-3" />
              )}
              {isSuperAdmin ? "Super Admin" : "Admin"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "totpEnabled",
        header: "2FA",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {row.original.totpEnabled ? (
              <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 gap-1">
                <Smartphone className="size-3" />
                Đã bật
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Trạng thái",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <div
              className={`size-2 rounded-full ${
                row.original.isActive ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm">
              {row.original.isActive ? "Hoạt động" : "Đã khoá"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "lastLogin",
        header: "Lần cuối đăng nhập",
        cell: ({ row }) => {
          if (!row.original.lastLogin) return <span className="text-xs text-muted-foreground">Chưa đăng nhập</span>;
          return (
            <span className="text-sm">
              {new Date(row.original.lastLogin).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original);
              }}
              title="Sửa"
            >
              <Pencil className="size-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`size-8 ${
                row.original.isActive
                  ? "text-amber-600 hover:text-amber-700"
                  : "text-green-600 hover:text-green-700"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                const msg = row.original.isActive
                  ? `Khoá tài khoản "${row.original.username}"?`
                  : `Kích hoạt lại tài khoản "${row.original.username}"?`;
                if (confirm(msg)) onToggle(row.original._id);
              }}
              title={row.original.isActive ? "Khoá" : "Kích hoạt"}
            >
              {row.original.isActive ? (
                <XCircle className="size-3.5" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                if (
                  confirm(
                    `Xoá quản trị viên "${row.original.username}"? Hành động không thể hoàn tác.`,
                  )
                ) {
                  onDelete(row.original._id);
                }
              }}
              title="Xoá"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, onToggle, onDelete],
  );

  return columns;
};

// ─── Main Page ──────────────────────────────────────────────────────────
const Admins = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminListItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admins.list({ search: search || undefined }),
    queryFn: () =>
      adminManagementService.list({ search: search || undefined }),
  });

  // Interceptor đã unwrap success.data, data trả về trực tiếp { admins, totalPages, ... }
  const admins: AdminListItem[] = data?.admins || [];
  const pagination = {
    currentPage: data?.currentPage || 1,
    totalPages: data?.totalPages || 1,
    totalItems: data?.totalItems || 0,
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminManagementService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admins.all });
      toast.success("Đã xoá quản trị viên");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminManagementService.toggleStatus(id),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: queryKeys.admins.all });
      toast.success(res?.message || "Đã thay đổi trạng thái");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    },
  });

  const handleEdit = useCallback((admin: AdminListItem) => {
    setEditingAdmin(admin);
    setShowForm(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingAdmin(null);
    setShowForm(true);
  }, []);

  const handleToggle = useCallback(
    (id: string) => toggleMutation.mutate(id),
    [toggleMutation],
  );

  const handleDelete = useCallback(
    (id: string) => deleteMutation.mutate(id),
    [deleteMutation],
  );

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admins.all });
  }, [qc]);

  const columns = useAdminColumns(handleEdit, handleToggle, handleDelete);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Quản lý quản trị viên"
        description="Thêm, sửa, khoá hoặc xoá tài khoản quản trị viên"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh} disabled={isLoading}>
              <RefreshCw className="mr-2 size-4" />
              Làm mới
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 size-4" />
              Thêm admin
            </Button>
          </div>
        }
      />

      <div className="max-w-sm">
        <SearchBar
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onSearch={setSearch}
          loading={isLoading}
        />
      </div>

      <DataTable
        columns={columns}
        data={admins}
        loading={isLoading}
        totalItems={pagination.totalItems}
        currentPage={pagination.currentPage}
        pageSize={10}
      />

      <AdminFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        initialData={editingAdmin}
        onSuccess={() =>
          qc.invalidateQueries({ queryKey: queryKeys.admins.all })
        }
      />
    </div>
  );
};

export default Admins;
