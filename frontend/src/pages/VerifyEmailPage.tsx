import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/client/authService";
import { CheckCircle, Loader2, Mail, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(5);
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setErrorMsg("Không tìm thấy token xác thực.");
        return;
      }

      try {
        const response = await authService.verifyEmail(token);
        setStatus("success");
        toast.success(response?.message || "Xác thực email thành công!");
      } catch (error: any) {
        setStatus("error");
        const message =
          error?.message ||
          "Xác thực email thất bại.";
        setErrorMsg(message);
      }
    };
    verifyEmail();
  }, [token]);

  // Auto-redirect đếm ngược khi xác thực thành công
  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (status === "success" && countdown === 0) {
      navigate("/signin");
    }
  }, [status, countdown, navigate]);

  const handleResend = async () => {
    if (!email) {
      toast.error("Vui lòng nhập email để nhận link mới");
      return;
    }
    try {
      setResending(true);
      const response = await authService.resendVerify(email);
      toast.success(
        response?.message || "Link xác thực đã được gửi lại. Vui lòng kiểm tra email.",
      );
      setEmail("");
    } catch (error: any) {
      const message =
        error?.message || "Có lỗi xảy ra khi gửi lại link xác thực.";
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 p-6 md:p-10 relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 size-96 bg-blue-200/20 dark:bg-blue-500/5 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 animate-pulse" />
      <div className="absolute bottom-0 right-0 size-64 bg-cyan-200/20 dark:bg-cyan-500/5 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 animate-pulse" />

      <GlassCard className="w-full max-w-md">
        <CardContent className="p-6 md:p-8 space-y-6 relative">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4 text-center animate-in fade-in duration-300">
              <div className="size-12 sm:size-16 mx-auto rounded-full bg-gradient-brand flex items-center justify-center">
                <Loader2 className="size-6 sm:size-8 animate-spin text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Đang xác thực email...</h2>
              <p className="text-sm text-muted-foreground">
                Vui lòng đợi trong giây lát.
              </p>
              <div className="w-full max-w-xs mx-auto">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse w-[60%]" />
                </div>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="size-12 sm:size-16 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-glow-sm">
                <CheckCircle className="size-6 sm:size-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Xác thực thành công!
              </h2>
              <p className="text-sm text-muted-foreground">
                Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay bây giờ.
              </p>
              <div className="text-sm text-muted-foreground">
                Tự động chuyển đến trang đăng nhập sau{" "}
                <span className="font-bold text-blue-600">{countdown}</span> giây...
              </div>
              <GradientButton className="w-full" onClick={() => navigate("/signin")}>
                <Mail className="mr-2 size-4" />
                Đăng nhập ngay
              </GradientButton>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4 text-center animate-in fade-in duration-300">
              <div className="size-12 sm:size-16 mx-auto rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
                <XCircle className="size-6 sm:size-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-red-600">
                Xác thực thất bại
              </h2>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>

              <div className="w-full space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Nhập email bạn đã đăng ký để nhận link xác thực mới:
                </p>
                <Input
                  type="email"
                  className="border-border/50 bg-muted/20"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <GradientButton
                  className="w-full"
                  onClick={handleResend}
                  disabled={resending}
                >
                  <RefreshCw
                    className={`mr-2 size-4 ${resending ? "animate-spin" : ""}`}
                  />
                  {resending ? "Đang gửi..." : "Gửi lại link xác thực"}
                </GradientButton>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/signin")}
              >
                Quay lại đăng nhập
              </Button>
            </div>
          )}
        </CardContent>
      </GlassCard>
    </div>
  );
};

export default VerifyEmailPage;
