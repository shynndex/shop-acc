import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
          error?.response?.data?.message ||
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
        error?.response?.data?.message || "Có lỗi xảy ra khi gửi lại link xác thực.";
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-6 space-y-6">
          {status === "loading" && (
            <>
              <Loader2 className="size-16 mx-auto animate-spin text-blue-600" />
              <h2 className="text-xl font-bold">Đang xác thực email...</h2>
              <p className="text-muted-foreground">
                Vui lòng đợi trong giây lát.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="size-16 mx-auto text-green-500" />
              <h2 className="text-2xl font-bold text-green-600">
                Xác thực thành công!
              </h2>
              <p className="text-muted-foreground">
                Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay bây giờ.
              </p>
              <div className="text-sm text-muted-foreground">
                Tự động chuyển đến trang đăng nhập sau{" "}
                <span className="font-bold text-blue-600">{countdown}</span> giây...
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => navigate("/signin")}
              >
                <Mail className="mr-2 size-4" />
                Đăng nhập ngay
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="size-16 mx-auto text-red-500" />
              <h2 className="text-2xl font-bold text-red-600">
                Xác thực thất bại
              </h2>
              <p className="text-muted-foreground">{errorMsg}</p>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Nhập email bạn đã đăng ký để nhận link xác thực mới:
                </p>
                <Input
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleResend}
                  disabled={resending}
                >
                  <RefreshCw
                    className={`mr-2 size-4 ${resending ? "animate-spin" : ""}`}
                  />
                  {resending ? "Đang gửi..." : "Gửi lại link xác thực"}
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/signin")}
              >
                Quay lại đăng nhập
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
