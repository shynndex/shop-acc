import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/authService";
import { CheckCircle, Link, Loader2, RefreshCw, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setErrorMsg("Không tìm thấy token xác thực.");
        return;
      }

      try {
        await authService.verifyEmail(token);
        setStatus("success");
      } catch (error) {
        setStatus("error");
        setErrorMsg("Xác thực email thất bại.");
      }
    };
    verifyEmail();
  }, [token]);

  const handleResend = async () => {
    if (!email) {
      toast.error("Vui lòng nhập email để nhận link mới");
      return;
    }
    try {
      setResending(true);
      await authService.resendVerify(email);
      toast.success("Link xác thực đã được gửi lại.");
      setEmail("");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Có lỗi xảy ra khi gửi lại link xác thực.",
      );
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
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <h2 className="text-2xl font-bold text-green-600">
                Xác thực thành công!
              </h2>
              <p className="text-muted-foreground">
                Tài khoản của bạn đã được kích hoạt.
              </p>
              <Link to="/login">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Đăng nhập ngay
                </Button>
              </Link>
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
                <Input
                  type="email"
                  placeholder="Nhập email đã đăng ký"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  className={"w-full bg-blue-600 hover:bg-blue-700"}
                  onClick={handleResend}
                  disabled={resending}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${resending ? "animate-spin" : ""}`}
                  />
                  Gửi lại link xác thực
                </Button>
              </div>

              <Link to={"/login"}>
                <Button variant="outline" className="w-full mt-2">
                  Quay lại đăng nhập
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
