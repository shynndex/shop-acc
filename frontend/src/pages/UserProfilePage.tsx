import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/clientAxios";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Calendar,
  ChevronRight,
  CreditCard,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Package,
  Pencil,
  Shield,
  Check,
  X,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { authService } from "@/services/client/authService";

const UserProfilePage = () => {
  const { user, loading, updateUser } = useAuthStore();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="py-8 max-w-3xl mx-auto">
        <GlassCard>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </GlassCard>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center">
        <GlassCard className="max-w-md mx-auto p-8">
          <UserIcon className="size-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h2>
          <p className="text-muted-foreground mb-6">
            Bạn cần đăng nhập để xem thông tin cá nhân.
          </p>
          <GradientButton onClick={() => navigate("/signin")}>Đăng nhập ngay</GradientButton>
        </GlassCard>
      </div>
    );
  }

  const quickActions = [
    {
      icon: Wallet,
      label: "Nạp tiền",
      description: "Nạp tiền vào ví để mua tài khoản",
      onClick: () => navigate("/shop"),
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      icon: Package,
      label: "Đơn hàng",
      description: "Xem lịch sử mua hàng",
      onClick: () => navigate("/me/orders"),
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: KeyRound,
      label: "Đổi mật khẩu",
      description: "Thay đổi mật khẩu tài khoản",
      onClick: () => toggleChangePassword(),
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  // ─── Display Name Edit ────────────────────────────────────────────
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName || "");
  const [displayNameSubmitting, setDisplayNameSubmitting] = useState(false);

  const handleUpdateDisplayName = async () => {
    const trimmed = displayNameInput.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập tên hiển thị");
      return;
    }
    if (trimmed.length > 30) {
      toast.error("Tên hiển thị tối đa 30 ký tự");
      return;
    }
    setDisplayNameSubmitting(true);
    try {
      await authService.updateDisplayName(trimmed);
      updateUser({ displayName: trimmed });
      toast.success("Cập nhật tên hiển thị thành công!");
      setEditingDisplayName(false);
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi xảy ra");
    } finally {
      setDisplayNameSubmitting(false);
    }
  };

  const cancelEditDisplayName = () => {
    setDisplayNameInput(user?.displayName || "");
    setEditingDisplayName(false);
  };

  // ─── Change Password ──────────────────────────────────────────────
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const toggleChangePassword = () => {
    setShowChangePassword((prev) => !prev);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pwCurrent || !pwNew || !pwConfirm) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (pwNew.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (pwNew !== pwConfirm) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setPwSubmitting(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: pwCurrent,
        newPassword: pwNew,
        confirmPassword: pwConfirm,
      });
      toast.success("Đổi mật khẩu thành công!");
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
      setShowChangePassword(false);
    } catch (error: any) {
      toast.error(error?.message || "Đổi mật khẩu thất bại");
    } finally {
      setPwSubmitting(false);
    }
  };

  return (
    <div className="py-8 max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <GlassCard className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500" />
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="size-24 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center shadow-lg">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="size-full rounded-full object-cover"
                />
              ) : (
                <UserIcon className="size-10 text-blue-600" />
              )}
            </div>
            <div className="flex-1 pt-2 sm:pt-0 sm:pb-1">
              {editingDisplayName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    className="h-9 max-w-[250px] text-base font-bold border-blue-400 focus-visible:ring-blue-500"
                    placeholder="Nhập tên hiển thị"
                    maxLength={30}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateDisplayName();
                      if (e.key === "Escape") cancelEditDisplayName();
                    }}
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="size-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={handleUpdateDisplayName}
                    disabled={displayNameSubmitting}
                  >
                    {displayNameSubmitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="size-8 text-muted-foreground hover:text-foreground"
                    onClick={cancelEditDisplayName}
                    disabled={displayNameSubmitting}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-2xl font-bold">{user.displayName}</h1>
                  <button
                    onClick={() => {
                      setDisplayNameInput(user.displayName);
                      setEditingDisplayName(true);
                    }}
                    className="size-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/50"
                    title="Đổi tên hiển thị"
                  >
                    <Pencil className="size-3.5 text-muted-foreground" />
                  </button>
                </div>
              )}
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
            <Badge
              variant="secondary"
              className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 self-start sm:self-center"
            >
              Thành viên
            </Badge>
          </div>
        </CardContent>
      </GlassCard>

      {/* Balance Card */}
      <GlassCard>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Wallet className="size-4" />
                Số dư ví
              </p>
              <p className="text-3xl font-bold text-green-600">
                {(user.balance || 0).toLocaleString("vi-VN")}đ
              </p>
            </div>
            <GradientButton onClick={() => navigate("/shop")}>
              <CreditCard className="size-4 mr-2" />
              Nạp tiền
            </GradientButton>
          </div>
        </CardContent>
      </GlassCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <GlassCard
            key={action.label}
            className="cursor-pointer hover:shadow-lg transition-all duration-300 group hover:-translate-y-0.5"
            onClick={action.onClick}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`size-10 rounded-lg ${action.bg} flex items-center justify-center flex-shrink-0`}
              >
                <action.icon className={`size-5 ${action.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {action.description}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </GlassCard>
        ))}
      </div>

      {/* Change Password Card */}
      {showChangePassword && (
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="size-5" />
              Đổi mật khẩu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Mật khẩu hiện tại</label>
                <Input
                  type="password"
                  className="border-border/50 bg-muted/20"
                  placeholder="Nhập mật khẩu hiện tại"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mật khẩu mới</label>
                <Input
                  type="password"
                  className="border-border/50 bg-muted/20"
                  placeholder="Ít nhất 6 ký tự"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Xác nhận mật khẩu mới</label>
                <Input
                  type="password"
                  className="border-border/50 bg-muted/20"
                  placeholder="Nhập lại mật khẩu mới"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <GradientButton type="submit" disabled={pwSubmitting} className="w-full sm:w-auto">
                  {pwSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Đổi mật khẩu
                </GradientButton>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPwCurrent("");
                    setPwNew("");
                    setPwConfirm("");
                  }}
                >
                  Huỷ
                </Button>
              </div>
            </form>
          </CardContent>
        </GlassCard>
      )}

      {/* Account Info */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserIcon className="size-5" />
            Thông tin tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground flex items-center gap-2">
              <Mail className="size-4" />
              Email
            </span>
            <span className="font-medium">{user.email}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground flex items-center gap-2">
              <UserIcon className="size-4" />
              Tên đăng nhập
            </span>
            <span className="font-medium">{user.username}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="size-4" />
              Ngày tham gia
            </span>
            <span className="font-medium">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                : "N/A"}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground flex items-center gap-2">
              <Package className="size-4" />
              Đơn hàng
            </span>
            <Button
              variant="link"
              className="p-0 h-auto font-medium"
              onClick={() => navigate("/me/orders")}
            >
              Xem lịch sử
            </Button>
          </div>
        </CardContent>
      </GlassCard>
    </div>
  );
};

export default UserProfilePage;