import { useAuthStore } from "@/stores/useAuthStore";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  BadgeAlert,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "../ui/field";
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "../ui/item";
import GiftCodeInput from "@/components/client/GiftCodeInput";
import type { GiftCodeResult } from "@/components/client/GiftCodeInput";
import { depositService } from "@/services/client/depositService";
import type { PaymentLinkData } from "@/types/deposit";
import { formatVND } from "@/lib/utils";
import { useDepositSSE } from "@/hooks/useDepositSSE";

interface DepositDialogProps {
  trigger?: React.ReactNode;
}

const DepositDialog = ({ trigger }: DepositDialogProps) => {
  const [open, setOpen] = useState(false);
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeDepositId, setActiveDepositId] = useState<string | null>(null);

  // Trạng thái Chuyển khoản
  const [bankAmount, setBankAmount] = useState("");
  const [paymentInfo, setPaymentInfo] = useState<PaymentLinkData | null>(null);
  // Trạng thái Thẻ cào
  const [cardType, setCardType] = useState("viettel");
  const [serial, setSerial] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [pin, setPin] = useState("");
  const [receivedAmount, setReceivedAmount] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  // Giftcode state
  const [discountCode, setDiscountCode] = useState<string | null>(null);

  const quickAmounts = [10000, 50000, 100000, 200000, 500000];

  useDepositSSE((data) => {
    const isMatch =
      data.referenceCode === paymentInfo?.referenceCode ||
      data.depositId === activeDepositId;
    if (isMatch) {
      if (data.status === "PAID") {
        toast.success(data.message || "Nạp tiền thành công", {
          description: `Số tiền ${data.amount?.toLocaleString("vi-VN")}đ`,
          duration: 5000,
        });
        // Cập nhật số dư
        updateUser({ balance: (user?.balance || 0) + (data.amount || 0) });
      }
      setTimeout(() => {
        handleClose();
        setActiveDepositId(null);
      }, 2000);
    }
  });

  // Tính lại receivedAmount khi telco hoặc cardAmount thay đổi
  useEffect(() => {
    if (!cardType || !cardAmount) {
      setReceivedAmount(null);
      return;
    }

    const calculate = async () => {
      setFeeLoading(true);

      try {
        const data = await depositService.calculateFee(
          cardType,
          parseInt(cardAmount),
        );
        setReceivedAmount(data.receivedAmount);
      } catch (error) {
        toast.error("Không thể tính phí nạp thẻ.Vui lòng thử lại sau");
        console.warn("Fee API failed");
      } finally {
        setFeeLoading(false);
      }
    };
    const timeout = setTimeout(calculate, 500);
    return () => clearTimeout(timeout);
  }, [cardType, cardAmount]);

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
        toast.info("Yêu cầu nạp thẻ đã được gửi. Vui lòng đợi xử lý");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi gửi yêu cầu nạp thẻ");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã copy ${label}`);
  };

  const handleCreatePayment = async () => {
    const amount = parseInt(bankAmount);
    if (!amount || amount < 10000) {
      toast.error("Số tiền nạp tối thiểu là 10.000đ");
      return;
    }

    setLoading(true);

    try {
      const data = await depositService.createPaymentQR(amount, discountCode || undefined);
      setActiveDepositId(data.referenceCode);
      setPaymentInfo(data);
      toast.info("Đã tạo mã QR. Vui lòng quét để thanh toán");
    } catch (error: any) {
      console.error("Create payment error:", error);
      toast.error(error?.message || "Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscountApply = (result: GiftCodeResult) => {
    if (result.valid && result.code) {
      setDiscountCode(result.code);
    }
  };

  const handleDiscountRemove = () => {
    setDiscountCode(null);
  };

  const handleClose = () => {
    setOpen(false);
    setBankAmount("");
    setPaymentInfo(null);
    setCardType("viettel");
    setSerial("");
    setCardAmount("");
    setPin("");
    setReceivedAmount(null);
    setActiveDepositId(null);
    setDiscountCode(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) handleClose();
        else setOpen(val);
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
          <DialogTitle>Nạp tiền vào ví</DialogTitle>
          <DialogDescription>
            Số dư:
            <span className="font-bold text-green-600 ml-1">
              {formatVND(user?.balance || 0)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="bank" className="w-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="bank" className="gap-1">
              <QrCode className="h-4 w-4" /> Chuyển khoản
            </TabsTrigger>
            <TabsTrigger value="card" className="gap-1">
              <CreditCard className="h-4 w-4" /> Thẻ cào
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  Chuyển khoản ngân hàng
                </CardTitle>
                <CardDescription className="text-lg font-semibold">
                  Quét mã QR hoặc chuyển khoản theo thông tin bên dưới
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg">
                    {paymentInfo?.qrImage ? (
                      <QRCodeSVG
                        value={paymentInfo.qrImage}
                        size={200}
                        level="L"
                        imageSettings={{
                          src: "../../public/viet_qr_1.png",
                          height: 40,
                          width: 40,
                          excavate: true,
                        }}
                      />
                    ) : (
                      <div className="size-[200px] flex items-center justify-center bg-gray-100 rounded-lg">
                        <QrCode className="size-16 text-gray-300" />
                      </div>
                    )}
                    <p className="text-sm text-center text-muted-foreground mt-3">
                      Quét mã để nạp tiền tự động
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <div className="text-lg font-bold mb-3">
                        Chọn nhanh số tiền cần nạp
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {quickAmounts.map((amount) => (
                          <Button
                            key={amount}
                            variant={
                              bankAmount === amount.toString()
                                ? "default"
                                : "outline"
                            }
                            onClick={() => setBankAmount(amount.toString())}
                            className="whitespace-nowrap"
                            size="sm"
                          >
                            {amount.toLocaleString("vi-VN")}đ
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Field>
                      <FieldLabel>Nhập số tiền khác</FieldLabel>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Nhập số tiền (tối thiểu 10.000đ)"
                          value={bankAmount ? formatVND(bankAmount) : ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            setBankAmount(raw);
                          }}
                          className="pr-12"
                          min={10000}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          đ
                        </span>
                      </div>
                      <Button
                        type="submit"
                        variant="secondary"
                        className="cursor-pointer mt-2"
                        onClick={handleCreatePayment}
                        disabled={loading}
                      >
                        {loading ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo...</>
                        ) : (
                          "Tạo mã chuyển khoản"
                        )}
                      </Button>
                    </Field>

                    {paymentInfo && (
                      <div className="pt-2 border-t">
                        <div className="text-lg font-semibold mb-3">
                          Thông tin chuyển khoản:
                        </div>
                        <Field data-disabled>
                          <FieldLabel>Chủ tài khoản</FieldLabel>
                          <div className="flex items-center justify-between gap-2 w-full">
                            <Input
                              value={paymentInfo?.accountName}
                              disabled
                              className="flex-1 disabled:opacity-100"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() =>
                                handleCopy(
                                  paymentInfo?.accountName || "",
                                  "Chủ tài khoản",
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>

                          <FieldLabel>Số tài khoản</FieldLabel>
                          <div className="flex items-center justify-between gap-2 w-full">
                            <Input
                              value={paymentInfo?.accountNumber || ""}
                              disabled
                              className="flex-1 disabled:opacity-100"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() =>
                                handleCopy(
                                  paymentInfo?.accountNumber || "",
                                  "Số tài khoản",
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>

                          <FieldLabel>Ngân hàng</FieldLabel>
                          <div className="flex items-center justify-between gap-2 w-full">
                            <Input
                              value={paymentInfo?.bankName || ""}
                              disabled
                              className="flex-1 disabled:opacity-100"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() =>
                                handleCopy(
                                  paymentInfo?.bankName || "",
                                  "Ngân hàng",
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </Field>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t mt-4">
                  <h4 className="text-sm font-semibold mb-3">Mã giảm giá</h4>
                  <GiftCodeInput
                    amount={parseInt(bankAmount) || 0}
                    onApply={handleDiscountApply}
                    onRemove={handleDiscountRemove}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="card">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  Nạp thẻ cào tự động
                </CardTitle>
                <CardDescription className="text-lg font-semibold">
                  Nhập thông tin thẻ cào để nạp tiền
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Item className="bg-red-300 mt-2">
                  <ItemMedia variant="icon">
                    <BadgeAlert />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>
                      Vui lòng chọn đúng mệnh giá, sai mệnh giá sẽ mất thẻ.
                    </ItemTitle>
                  </ItemContent>
                </Item>
                <FieldGroup className="space-y-4 mt-4">
                  <Field>
                    <FieldLabel>Loại thẻ</FieldLabel>
                    <Select value={cardType} onValueChange={setCardType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn loại thẻ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Chọn loại thẻ</SelectLabel>
                          <SelectItem value="viettel">Viettel</SelectItem>
                          <SelectItem value="mobi">MobiFone</SelectItem>
                          <SelectItem value="vina">Vinaphone</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Mệnh giá</FieldLabel>
                      <Select value={cardAmount} onValueChange={setCardAmount}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn mệnh giá" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Chọn mệnh giá</SelectLabel>
                            {quickAmounts.map((amount) => (
                              <SelectItem
                                key={amount}
                                value={amount.toString()}
                              >
                                {amount.toLocaleString()} VND
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Thực nhận</FieldLabel>
                      <div className="relative w-full">
                        <Input
                          value={
                            receivedAmount
                              ? formatVND(receivedAmount)
                              : feeLoading
                                ? "Đang tính..."
                                : ""
                          }
                          disabled
                          className="pr-16 border border-gray-300 text-black disabled:opacity-100"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 font-semibold">
                          đ
                        </span>
                      </div>
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>Số serial</FieldLabel>
                    <Input
                      placeholder="Nhập số serial"
                      value={serial}
                      onChange={(e) => setSerial(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Mã thẻ</FieldLabel>
                    <Input
                      placeholder="Nhập mã thẻ"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button
                  className="w-full"
                  disabled={
                    feeLoading ||
                    loading ||
                    !cardType ||
                    !cardAmount ||
                    !serial ||
                    !pin ||
                    serial.length < 10 ||
                    pin.length < 8
                  }
                  onClick={() => handleCardSubmit()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" /> Nạp thẻ
                    </>
                  )}
                </Button>
                <div className="w-full mt-4 pt-4 border-t">
                  <GiftCodeInput
                    amount={parseInt(cardAmount) || 0}
                    onApply={handleDiscountApply}
                    onRemove={handleDiscountRemove}
                  />
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DepositDialog;
