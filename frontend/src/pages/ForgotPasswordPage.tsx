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
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Vui lòng nhập email");
      return;
    }

    try {
      setLoading(true);
      const response = await authService.forgotPassword(trimmedEmail);
      setSent(true);
      toast.success(
        response?.message ||
          "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.",
      );
    } catch (error: any) {
      toast.error(
        error?.message || "Có lỗi xảy ra, vui lòng thử lại",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950" />
      <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative w-full max-w-md">
        <GlassCard className="overflow-hidden p-0 border-0 shadow-xl">
          <CardContent className="p-6 sm:p-8 glass-strong">
            <div className={sent ? "animate-in fade-in duration-300" : ""}>
            {sent ? (
              <FieldGroup>
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="size-12 sm:size-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="size-6 sm:size-8 text-green-600" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold">Đã gửi email! 📧</h1>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Nếu email <span className="font-medium text-blue-600">{email}</span>{" "}
                    tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 space-y-2">
                  <p className="font-medium">📌 Hướng dẫn:</p>
                  <ol className="list-decimal list-inside space-y-1 text-amber-700">
                    <li>Kiểm tra hộp thư <strong>{email}</strong></li>
                    <li>
                      Tìm email từ <strong>ShopSam</strong> với tiêu đề "Đặt lại mật
                      khẩu"
                    </li>
                    <li>Kiểm tra mục Spam nếu không thấy</li>
                    <li>Nhấn vào nút <strong>"Đặt lại mật khẩu"</strong> trong email</li>
                    <li>Link có hiệu lực trong <strong>15 phút</strong></li>
                  </ol>
                </div>

                <Button
                  variant="outline"
                  className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                >
                  Gửi lại email
                </Button>

                <Link
                  to="/signin"
                  className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <ArrowLeft className="size-4" />
                  Quay lại đăng nhập
                </Link>
              </FieldGroup>
            ) : (
              <div className="animate-in fade-in duration-300">
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="size-12 sm:size-16 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                      <Mail className="size-6 sm:size-8 text-blue-600" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold">Quên mật khẩu? 🔐</h1>
                    <p className="text-sm text-muted-foreground">
                      Nhập email bạn đã đăng ký, chúng tôi sẽ gửi link đặt lại mật
                      khẩu cho bạn.
                    </p>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>                      <Input
                      id="email"
                      type="email"
                      placeholder="example@gmail.com"
                      className="border-border/50 focus-visible:ring-blue-500 bg-muted/20"
                      required
                      disabled={loading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                    <FieldDescription>
                      Email bạn đã dùng để đăng ký tài khoản.
                    </FieldDescription>
                  </Field>

                  <GradientButton
                    type="submit"
                    className="w-full h-11"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Đang gửi...
                      </span>
                    ) : (
                      "Gửi link đặt lại mật khẩu"
                    )}
                  </GradientButton>

                  <Link
                    to="/signin"
                    className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <ArrowLeft className="size-4" />
                    Quay lại đăng nhập
                  </Link>
                </FieldGroup>
              </form>
              </div>
            )}
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
