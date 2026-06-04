import { useAuthStore } from "@/stores/useAuthStore";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import GiftCodeInput from "@/components/client/GiftCodeInput";
import { depositService } from "@/services/client/depositService";
import { useDepositSSE } from "@/hooks/useDepositSSE";
import { cn, formatVND } from "@/lib/utils";
import type { GiftCodeResult } from "@/components/client/GiftCodeInput";
import type { PaymentLinkData } from "@/types/deposit";
import {
  Wallet,
  QrCode,
  CreditCard,
  Copy,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  Banknote,
  Sparkles,
  ShieldCheck,
  Clock,
  X,
  Coins,
} from "lucide-react";

/* ─── Types ─── */
interface DepositDialogProps {
  trigger?: React.ReactNode;
}

type DepositStep = "amount" | "method" | "payment" | "confirm";

const QUICK_AMOUNTS = [20000, 50000, 100000, 200000, 500000, 1000000];
const PAYMENT_METHODS = [
  {
    id: "bank",
    label: "Chuyển khoản",
    description: "QR Code tự động",
    icon: QrCode,
    badge: "Nhanh",
    badgeClass: "bg-green-500",
  },
  {
    id: "card",
    label: "Thẻ cào",
    description: "Viettel, Mobi, Vina",
    icon: CreditCard,
    badge: "Tự động",
    badgeClass: "bg-blue-500",
  },
];

/* ─── Step Indicator ─── */
const STEPS = [
  { key: "amount" as const, label: "Số tiền", number: 1 },
  { key: "method" as const, label: "Phương thức", number: 2 },
  { key: "payment" as const, label: "Thanh toán", number: 3 },
  { key: "confirm" as const, label: "Hoàn tất", number: 4 },
];

const StepIndicator = ({ currentStep }: { currentStep: DepositStep }) => {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6">
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isFuture = idx > currentIndex;

        return (
          <React.Fragment key={step.key}>
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "size-7 sm:size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                  isCompleted &&
                    "bg-gradient-brand text-white shadow-glow-sm scale-100",
                  isCurrent &&
                    "bg-gradient-brand text-white shadow-glow-sm scale-110 ring-2 ring-blue-300/50",
                  isFuture && "bg-muted/30 text-muted-foreground",
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="size-3.5 sm:size-4" />
                ) : (
                  step.number
                )}
              </div>              <span
                  className={cn(
                    "text-[9px] sm:text-[10px] font-medium hidden sm:block",
                  isCurrent
                    ? "text-primary font-semibold"
                    : isCompleted
                      ? "text-primary/70"
                      : "text-muted-foreground/50",
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-1 sm:mx-2 rounded-full transition-all duration-500",
                  isCompleted ? "bg-gradient-brand" : "bg-muted/30",
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════
   Main Deposit Modal
   ════════════════════════════════════════════════════════════════════ */
const DepositDialog = ({ trigger }: DepositDialogProps) => {
  const [open, setOpen] = useState(false);
  const { user, updateUser } = useAuthStore();

  // ─── Multi-step state ───
  const [step, setStep] = useState<DepositStep>("amount");

  // ─── Amount step ───
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  // ─── Method step ───
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // ─── Bank payment step ───
  const [paymentInfo, setPaymentInfo] = useState<PaymentLinkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeDepositId, setActiveDepositId] = useState<string | null>(null);
  const [paymentTimeout, setPaymentTimeout] = useState(false);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(300); // 5 minutes

  // ─── Card payment step ───
  const [cardType, setCardType] = useState("viettel");
  const [serial, setSerial] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [pin, setPin] = useState("");
  const [receivedAmount, setReceivedAmount] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  // ─── Gift code ───
  const [discountCode, setDiscountCode] = useState<string | null>(null);

  // ─── Payment timeout countdown ───
  useEffect(() => {
    if (step !== "payment" || selectedMethod !== "bank" || !activeDepositId) {
      setPaymentTimeout(false);
      setPaymentTimeLeft(300);
      return;
    }
    if (paymentTimeout) return;
    const timer = setInterval(() => {
      setPaymentTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPaymentTimeout(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, selectedMethod, activeDepositId, paymentTimeout]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ─── SSE for real-time status ───
  useDepositSSE((data) => {
    const isMatch =
      data.referenceCode === paymentInfo?.referenceCode ||
      data.depositId === activeDepositId;
    if (isMatch) {
      if (data.status === "PAID") {
        toast.success(data.message || "Nạp tiền thành công!", {
          description: `+${formatVND(data.amount || 0)}đ`,
          duration: 5000,
        });
        updateUser({
          balance: (user?.balance || 0) + (data.amount || 0),
        });
        setStep("confirm");
      }
    }
  });

  /* ─── Fee calculation for card ─── */
  useEffect(() => {
    if (!cardType || !cardAmount) {
      setReceivedAmount(null);
      return;
    }
    const timeout = setTimeout(async () => {
      setFeeLoading(true);
      try {
        const data = await depositService.calculateFee(cardType, parseInt(cardAmount));
        setReceivedAmount(data.receivedAmount);
      } catch {
        toast.error("Không thể tính phí nạp thẻ");
      } finally {
        setFeeLoading(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [cardType, cardAmount]);

  /* ─── Handlers ─── */
  const getAmount = useCallback(() => {
    if (selectedAmount) return selectedAmount;
    const parsed = parseInt(customAmount.replace(/\D/g, ""));
    return parsed || 0;
  }, [selectedAmount, customAmount]);

  const handleCreatePayment = async () => {
    const amount = getAmount();
    if (amount < 10000) {
      toast.error("Số tiền nạp tối thiểu là 10.000đ");
      return;
    }
    setLoading(true);
    try {
      const data = await depositService.createPaymentQR(
        amount,
        discountCode || undefined,
      );
      setActiveDepositId(data.referenceCode);
      setPaymentInfo(data);
      setStep("payment");
      toast.info("Đã tạo mã QR. Vui lòng quét để thanh toán");
    } catch (error: any) {
      toast.error(error?.message || "Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  const handleCardSubmit = async () => {
    if (!serial || !pin || serial.length < 10 || pin.length < 8) {
      toast.error("Vui lòng nhập đúng số serial và mã thẻ");
      return;
    }
    setLoading(true);
    try {
      const data = await depositService.submitCardDeposit({
        provider: cardType,
        amount: parseInt(cardAmount),
        serial: serial.toUpperCase(),
        pin: pin.trim(),
        discountCode: discountCode || undefined,
      });
      if (data.success) {
        setActiveDepositId(data.data.depositId);
        setStep("payment");
        toast.info("Yêu cầu nạp thẻ đã được gửi. Vui lòng đợi xử lý");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi gửi yêu cầu nạp thẻ");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã copy ${label}`);
  };

  const handleDiscountApply = (result: GiftCodeResult) => {
    if (result.valid && result.code) setDiscountCode(result.code);
  };
  const handleDiscountRemove = () => setDiscountCode(null);

  const handleClose = () => {
    setOpen(false);
    // Reset all state
    setTimeout(() => {
      setStep("amount");
      setSelectedAmount(null);
      setCustomAmount("");
      setSelectedMethod(null);
      setPaymentInfo(null);
      setCardType("viettel");
      setSerial("");
      setCardAmount("");
      setPin("");
      setReceivedAmount(null);
      setActiveDepositId(null);
      setDiscountCode(null);
      setLoading(false);
    }, 200);
  };

  const goToStep = (s: DepositStep) => setStep(s);
  const goBack = () => {
    if (step === "method") goToStep("amount");
    else if (step === "payment") goToStep("method");
    else if (step === "confirm") handleClose();
  };

  /* ════════════════════════════════════════════════════════════════
     Render: Step by Step
     ════════════════════════════════════════════════════════════════ */
  const renderStep = () => {
    switch (step) {
      /* ─── STEP 1: Select Amount ─── */
      case "amount":
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
            {/* Balance display */}
            <div className="flex items-center justify-between bg-gradient-brand-soft rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Số dư hiện tại</span>
              </div>
              <span className="text-lg font-bold text-primary">
                {formatVND(user?.balance || 0)}đ
              </span>
            </div>

            {/* Quick amounts */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Coins className="size-4 text-blue-500" />
                Chọn nhanh số tiền
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((amount) => {
                  const isSelected = selectedAmount === amount;
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount("");
                      }}
                      className={cn(
                        "relative h-12 sm:h-14 rounded-xl text-sm font-bold transition-all duration-200 border-2",
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shadow-glow-sm scale-105"
                          : "border-border/50 bg-muted/20 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/50 text-foreground",
                      )}
                    >
                      <span className="block leading-tight">{formatVND(amount)}</span>
                      <span className="block text-[9px] font-normal text-muted-foreground">đ</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2">
                Hoặc nhập số tiền khác
              </h3>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Nhập số tiền (tối thiểu 10.000đ)"
                  value={customAmount ? formatVND(customAmount) : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setCustomAmount(raw);
                    if (raw) setSelectedAmount(null);
                  }}
                  className="h-12 pr-12 text-base font-medium bg-muted/20 border-border/50 focus:border-blue-400"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  đ
                </span>
              </div>
            </div>

            {/* Gift code */}
            <div className="pt-1">
              <GiftCodeInput
                amount={getAmount()}
                onApply={handleDiscountApply}
                onRemove={handleDiscountRemove}
              />
            </div>

            {/* Next button */}
            <GradientButton
              className="w-full h-12 text-base"
              disabled={getAmount() < 10000}
              onClick={() => goToStep("method")}
            >
              Tiếp theo
              <ChevronRight className="size-4 ml-1" />
            </GradientButton>
          </div>
        );

      /* ─── STEP 2: Select Method ─── */
      case "method":
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            {/* Amount summary */}
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">Số tiền nạp</p>
              <p className="text-3xl font-bold text-primary">
                {formatVND(getAmount())}đ
              </p>
              {discountCode && (
                <Badge
                  variant="secondary"
                  className="mt-1 bg-green-100 text-green-700 border-green-200 gap-1"
                >
                  <Sparkles className="size-3" />
                  Mã giảm giá: {discountCode}
                </Badge>
              )}
            </div>

            {/* Method cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethod(method.id)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 text-center",
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-glow-sm scale-105"
                        : "border-border/50 bg-muted/10 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/50",
                    )}
                  >
                    <div
                      className={cn(
                        "size-10 rounded-full flex items-center justify-center",
                        isSelected
                          ? "bg-gradient-brand text-white"
                          : "bg-muted/30 text-muted-foreground",
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{method.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                    {method.badge && (
                      <Badge
                        className={cn(
                          "absolute top-2 right-2 text-[9px] px-1.5 py-0 h-auto text-white border-0",
                          method.badgeClass,
                        )}
                      >
                        {method.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={goBack} className="gap-1.5">
                <ArrowLeft className="size-4" />
                Quay lại
              </Button>
              {selectedMethod === "bank" && (
                <GradientButton
                  className="flex-1 h-11"
                  onClick={handleCreatePayment}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      Tạo mã QR <ChevronRight className="size-4 ml-1" />
                    </>
                  )}
                </GradientButton>
              )}
              {selectedMethod === "card" && (
                <GradientButton
                  className="flex-1 h-11"
                  onClick={() => goToStep("payment")}
                >
                  Nhập thông tin thẻ <ChevronRight className="size-4 ml-1" />
                </GradientButton>
              )}

            </div>
          </div>
        );

      /* ─── STEP 3A: Bank Payment (QR) ─── */
      case "payment":
        if (selectedMethod === "card") {
          return (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="text-center py-1">
                <p className="text-xs text-muted-foreground">Nạp thẻ cào</p>
                <p className="text-2xl font-bold text-primary">
                  {formatVND(cardAmount)}đ
                </p>
              </div>

              {/* Warning */}
              <GlassCard className="p-3 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" variant="subtle">
                <div className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                  <ShieldCheck className="size-4 mt-0.5 shrink-0" />
                  <p>Vui lòng chọn đúng mệnh giá. Sai mệnh giá sẽ mất thẻ và không được hoàn tiền.</p>
                </div>
              </GlassCard>

              {/* Card type */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Loại thẻ</label>
                <Select value={cardType} onValueChange={setCardType}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Chọn loại thẻ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Nhà mạng</SelectLabel>
                      <SelectItem value="viettel">Viettel</SelectItem>
                      <SelectItem value="mobi">MobiFone</SelectItem>
                      <SelectItem value="vina">Vinaphone</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Card amount */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Mệnh giá thẻ</label>
                <Select value={cardAmount} onValueChange={setCardAmount}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Chọn mệnh giá" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Mệnh giá</SelectLabel>
                      {[10000, 20000, 50000, 100000, 200000, 500000].map((a) => (
                        <SelectItem key={a} value={a.toString()}>
                          {formatVND(a)} VND
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Received amount */}
              {cardAmount && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Thực nhận</label>
                  <div className="relative">
                    <Input
                      value={
                        receivedAmount
                          ? formatVND(receivedAmount)
                          : feeLoading
                            ? "Đang tính..."
                            : ""
                      }
                      disabled
                      className={`h-11 pr-14 ${feeLoading ? "animate-pulse" : ""}`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-green-600">
                      đ
                    </span>
                  </div>
                </div>
              )}

              {/* Serial + Pin */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Số serial</label>
                  <Input
                    placeholder="Nhập số serial"
                    value={serial}
                    onChange={(e) => setSerial(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Mã thẻ</label>
                  <Input
                    placeholder="Nhập mã thẻ"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Gift code */}
              <div className="pt-1">
                <GiftCodeInput
                  amount={parseInt(cardAmount) || 0}
                  onApply={handleDiscountApply}
                  onRemove={handleDiscountRemove}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={goBack} className="gap-1.5">
                  <ArrowLeft className="size-4" />
                  Quay lại
                </Button>
                <GradientButton
                  className="flex-1 h-11"
                  disabled={
                    loading ||
                    !cardType ||
                    !cardAmount ||
                    !serial ||
                    !pin ||
                    serial.length < 10 ||
                    pin.length < 8
                  }
                  onClick={handleCardSubmit}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      Nạp thẻ <ChevronRight className="size-4 ml-1" />
                    </>
                  )}
                </GradientButton>
              </div>
            </div>
          );
        }

        // ─── Bank Payment: QR + Info ───
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            {/* Amount */}
            <div className="text-center py-1">
              <p className="text-xs text-muted-foreground">Quét mã để thanh toán</p>
              <p className="text-2xl font-bold text-primary">
                {formatVND(getAmount())}đ
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-4 bg-card rounded-xl border border-border/50">
                {paymentInfo?.qrImage ? (
                  <div className="p-2 bg-background rounded-lg shadow-sm">
                    <QRCodeSVG
                      value={paymentInfo.qrImage}
                      size={180}
                      level="L"
                      imageSettings={{
                        src: "../../public/viet_qr_1.png",
                        height: 36,
                        width: 36,
                        excavate: true,
                      }}
                    />
                  </div>
                ) : (
                  <div className="size-[180px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <QrCode className="size-14 text-muted-foreground/30" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  Quét mã QR bằng app ngân hàng
                </p>
              </div>

              {/* Payment details */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Banknote className="size-4 text-blue-500" />
                  Thông tin chuyển khoản
                </h4>

                {[
                  {
                    label: "Ngân hàng",
                    value: paymentInfo?.bankName || "Đang tải...",
                  },
                  {
                    label: "Chủ tài khoản",
                    value: paymentInfo?.accountName || "Đang tải...",
                  },
                  {
                    label: "Số tài khoản",
                    value: paymentInfo?.accountNumber || "Đang tải...",
                  },
                  {
                    label: "Nội dung",
                    value: paymentInfo?.referenceCode || "Đang tải...",
                    highlight: true,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/10 border border-border/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p
                        className={cn(
                          "text-xs sm:text-sm font-semibold truncate",
                          item.highlight && "text-blue-600",
                        )}
                      >
                        {item.value}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => handleCopy(item.value, item.label)}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                ))}

                {/* Waiting / Timeout indicator */}
                {paymentTimeout ? (
                  <div className="flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/50 rounded-lg px-3 py-2 border border-amber-200/50">
                    <Clock className="size-3" />
                    <span>Không nhận được thanh toán. Vui lòng thử lại.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950/50 rounded-lg px-3 py-2 border border-blue-200/50">
                    <Loader2 className="size-3 animate-spin" />
                    <span>Đang chờ thanh toán... ({formatTime(paymentTimeLeft)})</span>
                  </div>
                )}

                {/* Timer hint */}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Clock className="size-3" />
                  <span>Giao dịch sẽ tự động cập nhật sau khi chuyển khoản</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              {paymentTimeout ? (
                <GradientButton className="flex-1 h-11" onClick={goBack}>
                  <ArrowLeft className="size-4 mr-1" />
                  Thử lại
                </GradientButton>
              ) : (
                <>
                  <Button variant="outline" onClick={goBack} className="gap-1.5">
                    <ArrowLeft className="size-4" />
                    Quay lại
                  </Button>
                  {activeDepositId && paymentInfo && (
                    <Button
                      variant="ghost"
                      className="flex-1 gap-1.5 text-muted-foreground"
                      onClick={handleClose}
                    >
                      Đóng
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        );

      /* ─── STEP 4: Confirm ─── */
      case "confirm":
        return (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 animate-in fade-in zoom-in-95 duration-500">
            {/* Success circle */}
            <div className="relative mb-6">
              <div className="size-20 sm:size-24 rounded-full bg-gradient-brand flex items-center justify-center shadow-glow">
                <CheckCircle2 className="size-10 sm:size-12 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="size-6 text-amber-400 animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-center">
              Nạp tiền thành công!
            </h3>
            <p className="text-sm text-muted-foreground text-center mt-1 max-w-xs">
              Số dư tài khoản của bạn đã được cập nhật
            </p>

            {/* Balance display */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-brand-soft border border-blue-200/50 text-center min-w-[200px]">
              <p className="text-xs text-muted-foreground">Số dư hiện tại</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary mt-1">
                {formatVND(user?.balance || 0)}đ
              </p>
            </div>

            <GradientButton className="mt-8 w-full max-w-xs h-12" onClick={handleClose}>
              Hoàn tất
            </GradientButton>
          </div>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) handleClose();
        else setOpen(val);
      }}
    >
      {trigger && (
        <DialogTrigger render={trigger} />
      )}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden p-5 sm:p-6" showCloseButton={false}>
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between mb-2 space-y-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Wallet className="size-5 text-blue-500" />
            Nạp tiền
          </DialogTitle>
          {step !== "confirm" && (
            <button
              onClick={handleClose}
              className="size-8 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </DialogHeader>

        {/* Step indicator */}
        {step !== "confirm" && <StepIndicator currentStep={step} />}

        {/* Step content */}
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};

export default DepositDialog;
