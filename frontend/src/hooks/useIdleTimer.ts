import { useEffect, useRef, useCallback } from "react";

export interface IdleTimerOptions {
  /** Thời gian inactive (ms) trước khi trigger onIdle */
  timeout: number;
  /** Thời gian (ms) trước khi timeout để hiển thị cảnh báo */
  warningBefore?: number;
  /** Callback khi user inactive quá timeout */
  onIdle: () => void;
  /** Callback khi sắp hết giờ (dùng để hiển thị cảnh báo) */
  onWarning?: () => void;
  /** Callback khi user hoạt động trở lại */
  onActive?: () => void;
  /** Chỉ chạy khi enabled = true */
  enabled?: boolean;
}

/**
 * useIdleTimer — Phát hiện inactivity của user.
 *
 * - Reset timer mỗi khi user tương tác (mouse move, click, keydown, scroll, touch)
 * - Gọi `onWarning` khi còn `warningBefore` ms trước khi idle
 * - Gọi `onIdle` khi user inactive quá `timeout` ms
 * - Gọi `onActive` khi user hoạt động trở lại sau warning/idle
 */
export function useIdleTimer({
  timeout = 30 * 60 * 1000, // 30 phút
  warningBefore = 60 * 1000, // 60 giây trước
  onIdle,
  onWarning,
  onActive,
  enabled = true,
}: IdleTimerOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWarningRef = useRef(false);
  const isIdleRef = useRef(false);
  const eventsRef = useRef<string[]>([
    "mousemove",
    "mousedown",
    "click",
    "keydown",
    "scroll",
    "touchstart",
    "touchmove",
    "wheel",
  ]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();

    // Nếu đang idle/warning → active trở lại
    if (isIdleRef.current || isWarningRef.current) {
      isIdleRef.current = false;
      isWarningRef.current = false;
      onActive?.();
    }

    if (!enabled) return;

    // Warning timer
    warningTimerRef.current = setTimeout(() => {
      if (!isIdleRef.current) {
        isWarningRef.current = true;
        onWarning?.();
      }
    }, timeout - warningBefore);

    // Idle timer
    timerRef.current = setTimeout(() => {
      isWarningRef.current = false;
      isIdleRef.current = true;
      onIdle();
    }, timeout);
  }, [timeout, warningBefore, onIdle, onWarning, onActive, enabled, clearTimers]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Bind / unbind events
  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    resetTimer();

    const events = eventsRef.current;
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [enabled, handleActivity, resetTimer, clearTimers]);
}
