import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/client/authService";
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(5);

  // Auto-redirect đếm ngược khi thành công
  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (status === "success" && countdown === 0) {
      navigate("/signin");
    }
  }, [status, countdown, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      setStatus("error");
      setErrorMsg("Link đặt lại mật khẩu không hợp lệ.");
      return;
    }

    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);
      const response = await authService.resetPassword(token, password);
      setStatus("success");
      toast.success(
        response?.message || "Mật khẩu đã được đặt lại thành công!",
      );
    } catch (error: any) {
      setStatus("error");
      const message =
        error?.message ||
        "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Không có token → hiển thị lỗi
  if (!token) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="relative w-full max-w-md">
        <GlassCard className="w-full border-0 shadow-xl">
          <CardContent className="pt-8 pb-6 text-center space-y-4 animate-in fade-in duration-300 glass-strong">
            <div className="size-12 sm:size-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="size-6 sm:size-8 text-red-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-red-600">
              Link không hợp lệ
            </h2>
            <p className="text-muted-foreground">
              Không tìm thấy token đặt lại mật khẩu. Vui lòng yêu cầu link mới.
            </p>
            <Link
              to="/forgot-password"
              className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft className="size-4" />
              Yêu cầu link mới
            </Link>
          </CardContent>
        </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950" />
      <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative w-full max-w-md">
        <GlassCard className="overflow-hidden p-0 border-0 shadow-xl">
          <CardContent className="p-6 sm:p-8 glass-strong">
            <div className="animate-in fade-in zoom-in-95 duration-300">
            {status === "success" ? (
              <FieldGroup>
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="size-12 sm:size-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="size-6 sm:size-8 text-green-500" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-600">
                    Đặt lại mật khẩu thành công! 🎉
</h2>
                  <p className="text-muted-foreground">
                    Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập bằng
                    mật khẩu mới.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Tự động chuyển đến trang đăng nhập sau{" "}
                    <span className="font-bold text-blue-600">{countdown}</span>{" "}
                    giây...
                  </div>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => navigate("/signin")}
                  >
                    Đăng nhập ngay
                  </Button>
                </div>
              </FieldGroup>
            ) : status === "error" ? (
              <FieldGroup>
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="size-12 sm:size-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="size-6 sm:size-8 text-red-500" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-red-600">
                    Đặt lại mật khẩu thất bại
                  </h2>
                  <p className="text-muted-foreground">{errorMsg}</p>
                  <Link
                    to="/forgot-password"
                    className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <ArrowLeft className="size-4" />
                    Yêu cầu link mới
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => navigate("/signin")}
                  >
                    Quay lại đăng nhập
                  </Button>
                </div>
              </FieldGroup>
            ) : (
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Đặt lại mật khẩu 🔐</h1>
                    <p className="text-sm text-muted-foreground">
                      Nhập mật khẩu mới cho tài khoản của bạn.
                    </p>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="password">Mật khẩu mới</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="border-blue-700 focus-visible:ring-blue-600 pr-10"
                        placeholder="Mật khẩu mới"
                        required
                        disabled={loading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 size-7"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4 text-muted-foreground" />
                        ) : (
                          <Eye className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <FieldDescription>Tối thiểu 6 ký tự.</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="confirmPassword">
                      Xác nhận mật khẩu
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className="border-blue-700 focus-visible:ring-blue-600 pr-10"
                        placeholder="Nhập lại mật khẩu"
                        required
                        disabled={loading}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 size-7"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="size-4 text-muted-foreground" />
                        ) : (
                          <Eye className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </Field>

                  <Button
                    type="submit"
                    className="w-full bg-blue-700 text-white hover:bg-blue-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </span>
                    ) : (
                      "Đặt lại mật khẩu"
                    )}
                  </Button>

                  <Link
                    to="/signin"
                    className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:underline"
                    onClick={(e) => {
                      if (loading) e.preventDefault();
                    }}
                  >
                    <ArrowLeft className="size-4" />
                    Quay lại đăng nhập
                  </Link>
                </FieldGroup>
              </form>
            )}
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
