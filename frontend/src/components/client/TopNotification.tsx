import { useState, useEffect } from "react";
import { useSiteConfig } from "@/hooks/usePublicSiteConfig";
import { X, Megaphone } from "lucide-react";

const STORAGE_KEY = "top-notification-dismissed";

/* ════════════════════════════════════════════════════════════════════
   TopNotification — dismissible banner that reads from SiteConfig
   ════════════════════════════════════════════════════════════════════ */
export default function TopNotification() {
  const { siteConfig } = useSiteConfig();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const text = siteConfig?.topNotification?.trim();
  const show = text && !dismissed;

  // Reset dismissed state when notification text changes
  useEffect(() => {
    if (!text) {
      // No notification to show — nothing to dismiss
      return;
    }
    // If the text changed from the last stored value, show again
    try {
      const lastText = localStorage.getItem("top-notification-text");
      if (lastText !== text) {
        localStorage.removeItem(STORAGE_KEY);
        setDismissed(false);
        localStorage.setItem("top-notification-text", text);
      }
    } catch {
      // ignore
    }
  }, [text]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  };

  if (!show) return null;

  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 text-white">
      <div className="container-wrapper flex items-center justify-between gap-3 py-2 sm:py-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Megaphone className="size-4 shrink-0 text-blue-200" />
          <p className="text-xs sm:text-sm font-medium truncate">{text}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-white/70 hover:text-white transition-colors p-0.5"
          aria-label="Đóng thông báo"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
