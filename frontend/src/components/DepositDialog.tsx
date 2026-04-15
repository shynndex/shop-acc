import { useAuthStore } from "@/stores/useAuthStore";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  AxeIcon,
  BadgeAlert,
  Clock,
  Copy,
  CreditCard,
  Icon,
  QrCode,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { AspectRatio } from "./ui/aspect-ratio";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
} from "./ui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "./ui/item";

interface DepositDialogProps {
  trigger?: React.ReactNode;
}

const BANK_INFO = {
  bankName: "MB Bank",
  accountHolder: "NGUYEN VAN A", // Tên chủ tài khoản
  accountNumber: "1234567890", // Số tài khoản
};

const DepositDialog = ({ trigger }: DepositDialogProps) => {
  const [open, setOpen] = useState(false);
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Trạng thái Chuyển khoản
  const [bankAmount, setBankAmount] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Trạng thái Thẻ cào
  const [cardType, setCardType] = useState("viettel");
  const [serial, setSerial] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [pin, setPin] = useState("");

  const quickAmounts = [50000, 100000, 200000, 500000];

  const handleBankSubmit = async () => {
    const amount = parseInt(bankAmount);
    if (!amount || amount < 10000) {
      toast.error("Số tiền nạp tối thiểu là 10.000đ");
      return;
    }
    setLoading(true);
  };

  const handleCardSubmit = async () => {
    if (!serial || !pin || serial.length < 10 || pin.length < 8) {
      toast.error("Vui lòng nhập đúng số serial và mã thẻ");
      return;
    }
    setLoading(true);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã copy ${label}`);
  };

  const handleClose = () => {
    setIsListening(false);
    setOpen(false);
    setBankAmount("");
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
            <span className="font-bold text-green-600">
              {(user?.balance || 0).toLocaleString("vi-VN")}đ
            </span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="bank" className="w-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="bank" className="gap-2">
              <QrCode className="h-4 w-4" /> Chuyển khoản
            </TabsTrigger>
            <TabsTrigger value="card" className="gap-2">
              <Smartphone className="h-4 w-4" /> Thẻ cào
            </TabsTrigger>
          </TabsList>

          <TabsContent value={"bank"}>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  Chuyển khoản ngân hàng
                </CardTitle>
                <CardDescription className="text-lg font-semibold">
                  Quét mã QR để nạp tiền
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AspectRatio ratio={10 / 3}>
                  <img
                    src="https://img.vietqr.io/image/BIDV-V3GSTBG35037956-qr_only.png?addInfo=SAM000384"
                    alt="Image"
                    className="rounded-md object-cover w-80 mx-auto"
                  />
                </AspectRatio>
                <div className="mt-5 text-lg font-bold">
                  Số tiền nạp tối thiểu 10.000 đồng.
                </div>

                <div className="mt-5 text-lg ">
                  Hoặc chuyển khoản theo đúng thông tin sau:
                </div>
              </CardContent>

              <CardFooter>
                <Field data-disabled>
                  <FieldLabel htmlFor="input-demo-disabled">
                    Chủ tài khoản
                  </FieldLabel>

                  <div className="flex items-center justify-between gap-2 w-full">
                    <Input
                      value={BANK_INFO.accountHolder}
                      disabled
                      className="flex-1 border border-gray-300 text-black disabled:opacity-100"
                    />

                    <Button
                      variant={"ghost"}
                      className="h-8 w-8 border rounded-md whitespace-nowrap cursor-pointer"
                      onClick={() =>
                        handleCopy(BANK_INFO.accountHolder, "Chủ tài khoản")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <FieldLabel htmlFor="input-demo-disabled">
                    Số tài khoản
                  </FieldLabel>
                  <div className="flex items-center justify-between gap-2 w-full">
                    <Input
                      value={BANK_INFO.accountNumber}
                      disabled
                      className="flex-1 border border-gray-300 text-black disabled:opacity-100"
                    />

                    <Button
                      variant={"ghost"}
                      className="h-8 w-8 border rounded-md whitespace-nowrap cursor-pointer"
                      onClick={() =>
                        handleCopy(BANK_INFO.accountNumber, "Số tài khoản")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <FieldLabel htmlFor="input-demo-disabled">
                    Ngân hàng
                  </FieldLabel>
                  <div className="flex items-center justify-between gap-2 w-full">
                    <Input
                      value={BANK_INFO.bankName}
                      disabled
                      className="flex-1 border border-gray-300 text-black disabled:opacity-100"
                    />

                    <Button
                      variant={"ghost"}
                      className="h-8 w-8 border rounded-md whitespace-nowrap cursor-pointer"
                      onClick={() =>
                        handleCopy(BANK_INFO.bankName, "Ngân hàng")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </Field>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value={"card"}>
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
                <FieldGroup className={"space-y-4 mt-4"}>
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
                          value={"50000"}
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
              <CardFooter>
                <Button className={"w-full"}>
                  <CreditCard className="mr-2 h-4 w-4" /> Nạp thẻ
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DepositDialog;
