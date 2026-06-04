import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/clientAxios";
import { BadgePercent, CheckCircle, Loader2, XCircle } from "lucide-react";
import { useState } from "react";

interface GiftCodeResult {
  valid: boolean;
  code?: string;
  type?: "percent" | "fixed";
  value?: number;
  discountAmount?: number;
  finalAmount?: number;
  message?: string;
}

interface GiftCodeInputProps {
  amount: number;
  game?: string;
  onApply: (result: GiftCodeResult) => void;
  onRemove: () => void;
}

const GiftCodeInput = ({ amount, game, onApply, onRemove }: GiftCodeInputProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GiftCodeResult | null>(null);

  const handleValidate = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await api.post<GiftCodeResult>("/giftcodes/validate", {
        code: code.toUpperCase().trim(),
        amount,
        game,
      });
      setResult(data);
      if (data.valid) {
        onApply(data);
      }
    } catch (error: any) {
      setResult({
        valid: false,
        message: error?.message || "Có lỗi xảy ra khi kiểm tra mã",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode("");
    setResult(null);
    onRemove();
  };

  return (
    <div className="space-y-2">
      {!result?.valid ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 group">
            <BadgePercent className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-blue-600" />
            <Input
              placeholder="Nhập mã giảm giá..."
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleValidate()}
              className="pl-10 transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
              maxLength={20}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidate}
            disabled={loading || !code.trim()}
            className="w-full sm:w-auto transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Áp dụng"
            )}
          </Button>
        </div>
      ) : null}

      {result && !result.valid && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          <XCircle className="size-4 flex-shrink-0" />
          <span>{result.message}</span>
        </div>
      )}

      {result?.valid && (
        <div className="animate-in fade-in zoom-in-95 duration-200 flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              {result.code}
            </span>
            <span className="text-xs text-green-600">
              (Giảm {result.discountAmount?.toLocaleString("vi-VN")}đ)
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-red-500 hover:text-red-700 transition-all duration-150 hover:scale-105 active:scale-95"
            onClick={handleRemove}
          >
            Huỷ
          </Button>
        </div>
      )}
    </div>
  );
};

export default GiftCodeInput;
export type { GiftCodeResult };
