import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useAdminAuth } from "@/stores/useAdminAuth";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Shield, Smartphone, LockIcon } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const totpInputRef = useRef<HTMLInputElement>(null);

  const {
    login,
    verifyTwoFactorLogin,
    cancelTwoFactorLogin,
    loading,
    requiresTwoFactor,
    loginEmail,
  } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Focus TOTP input when 2FA step appears
  useEffect(() => {
    if (requiresTwoFactor && totpInputRef.current) {
      totpInputRef.current.focus();
    }
  }, [requiresTwoFactor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      const result = await login({ email, password });

      // If 2FA is required, result will be the LoginResponse with tempToken
      if (result && typeof result === "object" && "requiresTwoFactor" in result) {
        return; // Stay on login form — TOTP input will show
      }

      // Normal login success
      toast.success("Đăng nhập thành công");
      const fromState = location.state?.from?.pathname;
      const fromParam = searchParams.get("redirect");
      const redirectTo = fromState || (fromParam ? decodeURIComponent(fromParam) : "/admin");
      navigate(redirectTo);
    } catch (error: any) {
      toast.error("Đăng nhập thất bại, Vui lòng kiểm tra lại thông tin");
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số");
      return;
    }

    try {
      await verifyTwoFactorLogin(totpCode);
      toast.success("Đăng nhập thành công");
      const fromState = location.state?.from?.pathname;
      const fromParam = searchParams.get("redirect");
      const redirectTo = fromState || (fromParam ? decodeURIComponent(fromParam) : "/admin");
      navigate(redirectTo);
    } catch (error: any) {
      setTotpCode("");
      toast.error(error?.message || "Mã xác thực không đúng");
    }
  };

  const handleCancel2FA = () => {
    cancelTwoFactorLogin();
    setTotpCode("");
  };

  // ─── Show 2FA verification step ─────────────────────────────────────
  if (requiresTwoFactor) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <GlassCard className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="size-5 text-blue-500" />
              <CardTitle>Xác thực hai yếu tố</CardTitle>
            </div>
            <CardDescription>
              Tài khoản <strong>{loginEmail}</strong> đã bật 2FA.
              Vui lòng nhập mã xác thực từ ứng dụng Authenticator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify2FA}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="totp-code">Mã xác thực</FieldLabel>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      ref={totpInputRef}
                      id="totp-code"
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      required
                      value={totpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setTotpCode(val);
                      }}
                      disabled={loading}
                      className="pl-10 text-center text-lg tracking-[0.5em] font-mono border-border/50 bg-muted/20"
                      autoComplete="one-time-code"
                    />
                  </div>
                  <FieldDescription className="text-xs">
                    Mở ứng dụng Authenticator và nhập mã 6 chữ số
                  </FieldDescription>
                </Field>
                <Field>
                  <GradientButton
                    type="submit"
                    disabled={loading || totpCode.length !== 6}
                    className="w-full"
                  >
                    {loading ? "Đang xác thực..." : "Xác thực"}
                  </GradientButton>
                </Field>
                <Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel2FA}
                    disabled={loading}
                    className="w-full text-muted-foreground"
                  >
                    <ArrowLeft className="size-4 mr-1" />
                    Quay lại đăng nhập
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </GlassCard>
      </div>
    );
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <GlassCard className="border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center size-12 rounded-full bg-gradient-brand mx-auto mb-3">
            <LockIcon className="size-6 text-white" />
          </div>
          <CardTitle className="text-xl">Admin Panel</CardTitle>
          <CardDescription>
            Nhập email và mật khẩu để đăng nhập
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="border-border/50 bg-muted/20"
                  autoComplete="username"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 border-border/50 bg-muted/20"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </Field>
              <Field>
                <GradientButton type="submit" disabled={loading} className="w-full">
                  Đăng nhập
                </GradientButton>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </GlassCard>
    </div>
  );
}
