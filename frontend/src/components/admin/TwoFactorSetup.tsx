import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ShieldOff, Copy, CheckCircle2, AlertCircle, Smartphone, KeyRound } from "lucide-react";
import { authService } from "@/services/admin/auth.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TwoFactorSetup() {
  const [open, setOpen] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpVerifiedAt, setTotpVerifiedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Setup flow
  const [step, setStep] = useState<"idle" | "qr" | "verify" | "done">("idle");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Disable flow
  const [disablePassword, setDisablePassword] = useState("");
  const [disableTotpCode, setDisableTotpCode] = useState("");
  const [disabling, setDisabling] = useState(false);

  // Fetch status on open
  useEffect(() => {
    if (open) {
      fetchStatus();
    }
  }, [open]);

  const fetchStatus = async () => {
    try {
      const status = await authService.getTwoFactorStatus();
      setTotpEnabled(status.totpEnabled);
      setTotpVerifiedAt(status.totpVerifiedAt);
      setStep("idle");
    } catch (err: any) {
      toast.error("Không thể tải trạng thái 2FA");
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    try {
      const response = await authService.setupTwoFactor();
      setQrCode(response.qrCode);
      setSecret(response.secret);
      setStep("qr");
      toast.success("Đã tạo mã QR, hãy quét bằng ứng dụng Authenticator");
    } catch (err: any) {
      toast.error(err?.message || "Không thể thiết lập 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (totpCode.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số");
      return;
    }
    setVerifying(true);
    try {
      await authService.verifyTwoFactor({ totpCode });
      setStep("done");
      setTotpEnabled(true);
      setTotpVerifiedAt(new Date().toISOString());
      toast.success("2FA đã được bật thành công!");
    } catch (err: any) {
      toast.error(err?.message || "Mã xác thực không đúng");
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (!disablePassword || disableTotpCode.length !== 6) {
      toast.error("Vui lòng nhập mật khẩu và mã 2FA");
      return;
    }
    setDisabling(true);
    try {
      await authService.disableTwoFactor({
        password: disablePassword,
        totpCode: disableTotpCode,
      });
      setTotpEnabled(false);
      setTotpVerifiedAt(null);
      setStep("idle");
      setDisablePassword("");
      setDisableTotpCode("");
      toast.success("2FA đã được tắt");
    } catch (err: any) {
      toast.error(err?.message || "Không thể tắt 2FA");
    } finally {
      setDisabling(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success("Đã sao chép mã bí mật");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            {totpEnabled ? (
              <Shield className="h-4 w-4 mr-2 text-emerald-500" />
            ) : (
              <ShieldOff className="h-4 w-4 mr-2 text-muted-foreground" />
            )}
            {totpEnabled ? "2FA Đã bật" : "Bảo mật 2 lớp"}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Xác thực hai yếu tố (2FA)
          </DialogTitle>
          <DialogDescription>
            Tăng cường bảo mật tài khoản admin với xác thực hai lớp
          </DialogDescription>
        </DialogHeader>

        {/* Status */}
        {step === "idle" && !totpEnabled && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Smartphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                Sử dụng ứng dụng <strong>Google Authenticator</strong> hoặc{" "}
                <strong>Authy</strong> để quét mã QR. Sau mỗi lần đăng nhập, bạn
                sẽ cần nhập mã 6 chữ số từ ứng dụng.
              </div>
            </div>
            <Button
              onClick={handleSetup}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Đang tạo..." : "Thiết lập 2FA"}
            </Button>
          </div>
        )}

        {/* QR Code */}
        {step === "qr" && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src={qrCode}
                alt="QR Code for 2FA"
                className="w-48 h-48 border rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <code className="text-xs flex-1 break-all font-mono">
                {secret}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopySecret}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Không thể quét? Nhập mã bí mật thủ công vào ứng dụng Authenticator
            </p>
            <div className="space-y-2">
              <Label htmlFor="totp-code">Mã xác thực (6 chữ số)</Label>
              <Input
                id="totp-code"
                placeholder="Nhập mã từ ứng dụng..."
                value={totpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setTotpCode(val);
                }}
                maxLength={6}
                className="text-center text-lg tracking-[0.5em] font-mono"
                disabled={verifying}
              />
            </div>
            <Button
              onClick={handleVerify}
              disabled={verifying || totpCode.length !== 6}
              className="w-full"
            >
              {verifying ? "Đang xác thực..." : "Xác thực & Bật 2FA"}
            </Button>
          </div>
        )}

        {/* Verified Success */}
        {step === "done" && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            </div>
            <p className="font-medium text-emerald-600 dark:text-emerald-400">
              2FA đã được bật thành công!
            </p>
            <p className="text-sm text-muted-foreground">
              Từ lần đăng nhập tiếp theo, bạn sẽ cần nhập mã 6 chữ số từ ứng
              dụng Authenticator.
            </p>
            <Button onClick={() => setOpen(false)}>Hoàn tất</Button>
          </div>
        )}

        {/* Already enabled — show disable option */}
        {step === "idle" && totpEnabled && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-emerald-700 dark:text-emerald-300">
                  2FA đang hoạt động
                </p>
                {totpVerifiedAt && (
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                    Kích hoạt lần cuối:{" "}
                    {new Date(totpVerifiedAt).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-destructive mb-3 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Tắt 2FA
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="disable-password">Mật khẩu hiện tại</Label>
                  <Input
                    id="disable-password"
                    type="password"
                    placeholder="Nhập mật khẩu..."
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    disabled={disabling}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="disable-totp">Mã 2FA từ ứng dụng</Label>
                  <Input
                    id="disable-totp"
                    placeholder="000000"
                    value={disableTotpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setDisableTotpCode(val);
                    }}
                    maxLength={6}
                    className="text-center text-lg tracking-[0.5em] font-mono"
                    disabled={disabling}
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDisable}
                  disabled={
                    disabling ||
                    !disablePassword ||
                    disableTotpCode.length !== 6
                  }
                  className="w-full"
                >
                  {disabling ? "Đang tắt..." : "Tắt 2FA"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
