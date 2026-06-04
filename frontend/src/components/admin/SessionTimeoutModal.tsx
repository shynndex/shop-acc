import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SessionTimeoutModalProps {
  open: boolean;
  /** Thời gian countdown (giây) */
  countdown?: number;
  onExtend: () => void;
  onLogout: () => void;
}

/**
 * SessionTimeoutModal — Hiển thị cảnh báo khi session sắp hết hạn.
 *
 * - Đếm ngược từ `countdown` giây
 * - User có thể chọn "Tiếp tục" để reset idle timer
 * - Hoặc "Đăng xuất" để logout ngay
 * - Hết countdown → tự động logout (dùng ref để tránh double call)
 */
export function SessionTimeoutModal({
  open,
  countdown = 60,
  onExtend,
  onLogout,
}: SessionTimeoutModalProps) {
  const [remaining, setRemaining] = useState(countdown);
  const logoutTriggeredRef = useRef(false);

  // Reset state mỗi khi modal mở/đóng
  useEffect(() => {
    if (!open) {
      setRemaining(countdown);
      logoutTriggeredRef.current = false;
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1 && !logoutTriggeredRef.current) {
          logoutTriggeredRef.current = true;
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [open, countdown, onLogout]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onExtend(); }}>
      <DialogContent className="max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-500/10 mb-2">
            <Clock className="size-6 text-amber-500" />
          </div>
          <DialogTitle className="text-center">
            Phiên đăng nhập sắp hết hạn
          </DialogTitle>
          <DialogDescription className="text-center">
            Bạn sẽ bị đăng xuất sau{" "}
            <strong className="text-foreground">
              {minutes > 0
                ? `${minutes}:${String(seconds).padStart(2, "0")}`
                : `${seconds}s`}
            </strong>{" "}
            do không hoạt động.
          </DialogDescription>
        </DialogHeader>

        {/* Visual countdown ring */}
        <div className="flex justify-center">
          <div className="relative size-16">
            <svg className="size-16 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="2.5"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="hsl(var(--warning))"
                strokeWidth="2.5"
                strokeDasharray={`${Math.max((remaining / countdown) * 100, 5)} 100`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
              {remaining > 9 ? `${remaining}s` : `0${remaining}s`}
            </span>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onLogout}
            className="flex-1 gap-2"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </Button>
          <Button
            onClick={onExtend}
            className="flex-1 gap-2"
          >
            <RefreshCw className="size-4" />
            Tiếp tục
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
