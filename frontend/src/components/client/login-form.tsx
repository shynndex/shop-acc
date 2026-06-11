import { cn } from "@/lib/utils";
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
import { Link, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAdminAuth } from "@/stores/useAdminAuth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { authService } from "@/services/client/authService";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, loading } = useAuthStore();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Tự điền email nếu vừa đăng ký xong (toast đã hiển thị ở signup)
  useEffect(() => {
    if (location.state?.registered) {
      if (location.state?.email) {
        setFormData((prev) => ({ ...prev, identifier: location.state.email }));
      }
      // Xoá state để không hiện lại khi refresh
      navigate(location.pathname, { replace: true });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleResend = async () => {      const email = unverifiedEmail || formData.identifier.trim();
    if (!email) {
      toast.error("Vui lòng nhập email để gửi lại link xác thực");
      return;
    }
    // Chỉ gửi nếu identifier là email (chứa @)
    if (!email.includes("@")) {
      toast.error("Vui lòng nhập email của bạn để gửi lại link xác thực");
      return;
    }
    try {
      setResending(true);
      await authService.resendVerify(email);
      toast.success("Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.");
    } catch (error: any) {
      toast.error(
        error?.message || "Có lỗi khi gửi lại email xác thực",
      );
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const identifier = formData.identifier.trim();
    const password = formData.password.trim();

    if (!identifier || !password) {
      toast.error("Vui lòng nhập email/tên đăng nhập và mật khẩu");
      return;
    }

    // Reset unverified state khi thử lại
    setUnverifiedEmail(null);

    try {
      const success = await signIn({
        identifier,
        password,
      });

      if (success) {
        toast.success("Đăng nhập thành công! 🎉");

        // Check if user is admin — redirect to admin panel
        const user = useAuthStore.getState().user;
        if (user?.role === "admin" || user?.role === "super_admin") {
          // Directly initialise admin auth state from signIn response
          // This ensures AdminProtectedRoute shows the dashboard immediately
          // even before checkAuth() completes with the admin_token cookie.
          const adminSession = (user as any).adminSession;
          if (adminSession) {
            useAdminAuth.setState({
              admin: {
                id: adminSession.id,
                username: adminSession.username,
                email: adminSession.email,
                role: adminSession.role,
                isActive: adminSession.isActive ?? true,
                lastLogin: adminSession.lastLogin,
              },
              isAuthenticated: true,
              loading: false,
            });
            navigate("/admin", { replace: true });
          } else {
            // Admin with 2FA enabled — force use /admin/login for TOTP
            toast.info("Vui lòng đăng nhập qua trang Admin để xác thực 2FA");
            navigate("/admin/login", { replace: true });
          }
        } else {
          // Redirect thông minh: về trang trước đó hoặc trang chủ
          const from = location.state?.from?.pathname || "/";
          navigate(from, { replace: true });
        }
      }
    } catch (error: any) {
      // Nếu lỗi 403 (email chưa xác thực), hiển thị nút gửi lại
      const msg = error?.message || "";
      if (msg.includes("chưa được xác thực")) {
        setUnverifiedEmail(identifier);
        toast.error(
          "Email chưa được xác thực. Vui lòng kiểm tra hộp thư hoặc gửi lại link xác thực.",
        );
      } else {
        toast.error(msg || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.");
      }
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6",
        className,
      )}
      {...props}
    >
      <GlassCard className="overflow-hidden p-0 border-0 shadow-xl">
        <CardContent className="grid p-0 md:grid-cols-2 w-full bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700">
          <form className="px-8 sm:px-10 py-12 sm:py-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-3 text-center mb-2">                  <h1 className="text-3xl font-bold">Đăng nhập</h1>
                <p className="text-sm text-muted-foreground">
                  Vui lòng đăng nhập để sử dụng dịch vụ của chúng tôi
                </p>
              </div>
              <Field>
                <FieldLabel>Email hoặc tên đăng nhập</FieldLabel>
                <Input                    id="identifier"
                    name="identifier"
                    type="text"
                    placeholder="Email hoặc tên đăng nhập"
                    className="border-border/50 focus-visible:ring-blue-500 bg-muted/20 h-12"
                  required
                  disabled={loading}
                  value={formData.identifier}
                  onChange={handleChange}
                  autoComplete="username"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                  <Link
                    to="/forgot-password"
                    className="ml-auto text-sm text-blue-700 underline-offset-2 hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="border-border/50 focus-visible:ring-blue-500 pr-10 bg-muted/20 h-12"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant={"ghost"}
                    size={"icon"}
                    className={"absolute right-1 top-1 size-7"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {" "}
                    {showPassword ? (
                      <EyeOff className="size-4 text-muted-foreground" />
                    ) : (
                      <Eye className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </Field>
              {unverifiedEmail && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-amber-800 font-medium">
                    ✉️ Email chưa được xác thực
                  </p>
                  {unverifiedEmail.includes("@") ? (
                    <p className="text-xs text-amber-700">
                      Vui lòng kiểm tra hộp thư <strong>{unverifiedEmail}</strong>{" "}
                      (kể cả mục Spam) hoặc nhấn nút bên dưới để gửi lại link xác thực.
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700">
                      Vui lòng nhập email của bạn vào ô trên và nhấn nút bên dưới để gửi lại link xác thực.
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    <RefreshCw className={`mr-2 size-4 ${resending ? "animate-spin" : ""}`} />
                    {resending ? "Đang gửi..." : "Gửi lại email xác thực"}
                  </Button>
                </div>
              )}

              <Field>
                <GradientButton
                  type="submit"
                  className="w-full h-12"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Đang đăng nhập...
                    </span>
                  ) : (
                    "Đăng nhập"
                  )}
                </GradientButton>
              </Field>
              {/* <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator> */}
              {/* <Field className="grid grid-cols-3 gap-4">
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Login with Apple</span>
                </Button>
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Login with Google</span>
                </Button>
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Login with Meta</span>
                </Button>
              </Field> */}
              <FieldDescription className="text-center text-xs">
                Không có tài khoản?{" "}
                <Link to="/signup" className="text-blue-600 font-medium hover:underline">
                  Đăng ký
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden md:flex flex-col items-center justify-center px-8 sm:px-10 py-12 sm:py-16 text-white overflow-hidden">
            <div className="text-center space-y-4 z-10">
              <div className="text-5xl mb-4">🎮</div>
              <h2 className="text-xl font-bold">Chào mừng trở lại!</h2>
              <p className="text-blue-100 text-xs leading-relaxed">
                Khám phá thế giới tài khoản game đa dạng, uy tín và giá tốt nhất
                tại ShopSam.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                <span className="px-3 py-1 bg-white/20 rounded-full text-[10px]">🔒 Bảo mật</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-[10px]">⚡ Nhanh chóng</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-[10px]">💯 Uy tín</span>
              </div>
            </div>
            <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-300/20 rounded-full blur-3xl" />
          </div>
        </CardContent>
      </GlassCard>
    </div>
  );
}
