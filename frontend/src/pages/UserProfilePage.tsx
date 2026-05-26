import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Shield,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const UserProfilePage = () => {
  const { user, loading } = useAuthStore();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <UserIcon className="size-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h2>
        <p className="text-muted-foreground mb-6">
          Bạn cần đăng nhập để xem thông tin cá nhân.
        </p>
        <Button onClick={() => navigate("/signin")}>Đăng nhập ngay</Button>
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
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600" />
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
              <h1 className="text-2xl font-bold">{user.displayName}</h1>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
            <Badge
              variant="secondary"
              className="bg-green-50 text-green-700 border-green-200 self-start sm:self-center"
            >
              Thành viên
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Balance Card */}
      <Card>
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
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/shop")}
            >
              <CreditCard className="size-4 mr-2" />
              Nạp tiền
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Card
            key={action.label}
            className="cursor-pointer hover:shadow-md transition-shadow group"
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
          </Card>
        ))}
      </div>

      {/* Change Password Card */}
      {showChangePassword && (
        <Card>
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
                  placeholder="Nhập mật khẩu hiện tại"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mật khẩu mới</label>
                <Input
                  type="password"
                  placeholder="Ít nhất 6 ký tự"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Xác nhận mật khẩu mới</label>
                <Input
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={pwSubmitting}>
                  {pwSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Đổi mật khẩu
                </Button>
                <Button
                  type="button"
                  variant="outline"
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
        </Card>
      )}

      {/* Account Info */}
      <Card>
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
      </Card>
    </div>
  );
};

export default UserProfilePage;