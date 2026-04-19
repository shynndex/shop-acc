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

  const connect = useCallback(() => {
    if (!user?.id || !accessToken || eventSourceRef.current) return;

    // Tạo kết nối SSE mới
    // EventSource không support custom headers, nên pass token qua query param
    const sseUrl = `${import.meta.env.VITE_API_URL}/sse/stream?token=${accessToken}`;

    console.log("[SSE] Connecting to:", sseUrl);
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    // Lắng nghe event "deposit_updated"
    eventSource.addEventListener("deposit_updated", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] Received deposit update:", data);

        // Hiển thị toast thông báo
        if (data.status === "PAID" || data.status === "SUCCESS") {
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
    };
    // Cleanup khi unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [user?.id, accessToken, onDepositUpdate]);

  // Tự động kết nối khi có user + token
  useEffect(() => {
   connect();

   return ()=>{
    if(eventSourceRef.current) {
      console.log("[SSE Frontend] 🔌 Closing connection...");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
   }
  }, [connect]);

  return { connect, isConnected: !!eventSourceRef.current };
};
