import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TwoFactorSetup } from "@/components/admin/TwoFactorSetup";
import { profileService } from "@/services/admin/profile.service";
import { useAdminAuth } from "@/stores/useAdminAuth";
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  KeyRound,
  CalendarClock,
  Smartphone,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const Profile = () => {
  const { admin, updateAdmin } = useAdminAuth();

  // ── Profile form ──────────────────────────────────────────
  const [username, setUsername] = useState(admin?.username || "");
  const [email, setEmail] = useState(admin?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Password form ─────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  if (!admin) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    const payload: Record<string, string> = {};
    if (username.trim() !== admin.username) payload.username = username.trim();
    if (email.trim() !== admin.email) payload.email = email.trim();

    if (Object.keys(payload).length === 0) {
      toast.info("Không có thông tin nào thay đổi");
      return;
    }

    setSavingProfile(true);
    try {
      const result = await profileService.updateProfile(payload);
      updateAdmin(result);
      toast.success("Đã cập nhật thông tin cá nhân");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Có lỗi xảy ra khi cập nhật",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setChangingPassword(true);
    try {
      await profileService.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success("Đã đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Có lỗi xảy ra khi đổi mật khẩu",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const roleLabel =
    admin.role === "super_admin" ? "Super Admin" : "Admin";
  const roleIcon =
    admin.role === "super_admin" ? (
      <ShieldCheck className="size-4" />
    ) : (
      <Shield className="size-4" />
    );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0 max-w-3xl">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div>            <h1 className="text-2xl font-bold tracking-tight">
          Thông tin cá nhân
        </h1>
        <p className="text-sm text-muted-foreground">
          Quản lý thông tin tài khoản quản trị của bạn
        </p>
      </div>

      {/* ── Profile Info Card ────────────────────────────────── */}
      <GlassCard>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="size-16 rounded-full">
            <AvatarFallback className="rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {admin.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{admin.username}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  admin.role === "super_admin" ? "default" : "secondary"
                }
                className="gap-1"
              >
                {roleIcon}
                {roleLabel}
              </Badge>
              {admin.isActive ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <span className="size-1.5 rounded-full bg-green-500" />
                  Hoạt động
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-600">
                  <span className="size-1.5 rounded-full bg-red-500" />
                  Đã khoá
                </span>
              )}
            </CardDescription>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="size-3.5 text-muted-foreground" />
                  Tên đăng nhập
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="size-3.5 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={savingProfile}
              className="min-w-[140px]"
            >
              {savingProfile && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Lưu thông tin
            </Button>
          </form>
        </CardContent>
      </GlassCard>

      {/* ── Change Password Card ─────────────────────────────── */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="size-5" />
            Đổi mật khẩu
          </CardTitle>
          <CardDescription>
            Mật khẩu phải có ít nhất 6 ký tự
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                Mật khẩu hiện tại
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Xác nhận mật khẩu mới
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                type="submit"
                disabled={changingPassword}
                className="min-w-[140px]"
              >
                {changingPassword && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Đổi mật khẩu
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4 mr-1" />
                ) : (
                  <Eye className="size-4 mr-1" />
                )}
                {showPassword ? "Ẩn" : "Hiện"} mật khẩu
              </Button>
            </div>
          </form>
        </CardContent>
      </GlassCard>

      {/* ── Security Card ────────────────────────────────────── */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="size-5" />
            Bảo mật
          </CardTitle>
          <CardDescription>
            Xác thực hai yếu tố (2FA) và thông tin tài khoản
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6 space-y-5">
          {/* 2FA Section */}
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Smartphone className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Xác thực hai yếu tố</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bảo vệ tài khoản bằng mã xác thực từ ứng dụng Authenticator
                </p>
              </div>
            </div>
            <TwoFactorSetup />
          </div>

          {/* Account Info */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <CalendarClock className="size-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Đăng nhập lần cuối
                </p>
                <p className="text-sm font-medium truncate">
                  {admin.lastLogin
                    ? new Date(admin.lastLogin).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Chưa đăng nhập"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Trạng thái</p>
                <p className="text-sm font-medium">
                  {admin.isActive ? "Đang hoạt động" : "Đã khoá"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </GlassCard>
    </div>
  );
};

export default Profile;
