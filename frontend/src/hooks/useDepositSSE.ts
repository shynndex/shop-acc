import { useAuthStore } from "@/stores/useAuthStore";
import type { DepositSSEData } from "@/types/deposit";
import { useEffect, useRef } from "react";
import { useCallback } from "react";
import { toast } from "sonner";

export const useDepositSSE = (
  onDepositUpdate?: (data: DepositSSEData) => void,
) => {
  const { user, accessToken } = useAuthStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 5;

  const connect = useCallback(() => {
    if (!user?.id || !accessToken || eventSourceRef.current) return;

    // Tạo kết nối SSE mới
    // EventSource không support custom headers, nên pass token qua query param
    const sseUrl = `${import.meta.env.VITE_API_URL}/sse/stream?token=${accessToken}`;

    console.log("[SSE] Connecting to:", sseUrl);
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;
    retryCountRef.current = 0;

    // Lắng nghe event "deposit_updated"
    eventSource.addEventListener("deposit_updated", (event) => {
      try {
        const rawData = JSON.parse(event.data);
        if (!rawData.type || !rawData.status) {
          console.warn("[SSE] Invalid data format:", rawData);
          return;
        }

        const data = rawData as DepositSSEData;
        console.log("[SSE] Received deposit update:", data);

        // Hiển thị toast thông báo
        if (data.status === "PAID") {
          toast.success(data.message || "Nạp tiền thành công", {
            description: `Số tiền ${data.amount?.toLocaleString("vi-VN")}đ `,
            duration: 5000,
          });
        } else if (data.status === "FAILED") {
          toast.error(data.message || "Nạp tiền thất bại", {
            duration: 5000,
          });
        }
        // Gọi callback để component cha cập nhật UI
        onDepositUpdate?.(data);
      } catch (error) {
        console.error("[SSE] Parse error:", error);
      }
    });

    // Xử lý lỗi kết nối
    eventSource.onerror = (error) => {
      console.error("[SSE] Connection error:", error);

      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        const delay = Math.min(1000 * 2 ** retryCountRef.current, 10000); // Max 10s

        console.log(
          `[SSE] Retrying in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`,
        );

        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            eventSourceRef.current?.close();
            eventSourceRef.current = null;
            connect(); // Retry
          }
        }, delay);
      } else {
        //  Notify user khi fail quá nhiều lần
        toast.error("Mất kết nối thông báo. Vui lòng tải lại trang.", {
          action: { label: "Tải lại", onClick: () => window.location.reload() },
          duration: 10000,
        });
      }
    };

    // Cleanup chỉ đóng connection, không gọi connect lại
    return () => {
      if (eventSourceRef.current) {
        console.log("[SSE] Closing connection");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [user?.id, accessToken, onDepositUpdate]);

  // Tự động kết nối khi có user + token
  useEffect(() => {
    if (user?.id && accessToken) {
      return connect(); // Return cleanup function từ connect()
    }
  }, [connect, user?.id, accessToken]);

  return {
    connect,
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
  };
};
