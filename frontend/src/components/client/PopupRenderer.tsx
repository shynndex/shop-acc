import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { uiService } from "@/services/client/uiService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Bell, Gift } from "lucide-react";
import type { Popup } from "@/types/admin/ui.type";

interface PopupRendererProps {
  currentPage: string;
  triggerClick?: boolean;
  onTriggerClick?: () => void;
}

const DISMISSED_KEY = "popup_dismissed";
const CACHE_KEY = "popup_session_seen";

/**
 * PopupRenderer - Hiển thị popup động trên client
 * - Tự động gọi API /api/ui/popups?page=<page>
 * - Hỗ trợ trigger: timeout (sau N giây) và click (từ admin/sự kiện)
 * - Chỉ hiển thị 1 popup ưu tiên nhất (sortOrder cao nhất)
 * - Dismiss trong session
 */
const PopupRenderer: React.FC<PopupRendererProps> = ({
  currentPage,
  triggerClick = false,
}) => {
  const [open, setOpen] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<Popup | null>(null);
  const [showManualTrigger, setShowManualTrigger] = useState(false);

  const { data } = useQuery({
    queryKey: ["ui", "popups", currentPage],
    queryFn: () => uiService.getPopups(currentPage),
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    retry: false,
  });

  const popups: Popup[] = data?.popups || [];

  // Lấy popup ưu tiên nhất (sortOrder thấp nhất = ưu tiên cao)
  const bestPopup = popups.length > 0
    ? popups.reduce((best, p) => (p.sortOrder < best.sortOrder ? p : best))
    : null;

  // Kiểm tra popup đã dismiss trong session chưa
  const isDismissed = useCallback((popupId: string) => {
    try {
      const dismissed = JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || "[]");
      return dismissed.includes(popupId);
    } catch {
      return false;
    }
  }, []);

  const markDismissed = useCallback((popupId: string) => {
    try {
      const dismissed = JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || "[]");
      if (!dismissed.includes(popupId)) {
        dismissed.push(popupId);
        sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
      }
    } catch {
      // ignore
    }
  }, []);

  // Timeout trigger
  useEffect(() => {
    if (!bestPopup || isDismissed(bestPopup._id)) return;
    if (triggerClick) return; // Skip timeout if click-trigger mode

    if (bestPopup.triggerType === "timeout") {
      const delay = (bestPopup.triggerDelay || 5) * 1000;
      const timer = setTimeout(() => {
        setCurrentPopup(bestPopup);
        setOpen(true);
      }, delay);

      return () => clearTimeout(timer);
    } else if (bestPopup.triggerType === "click") {
      // Popup trigger=click: show một nút nhỏ để user click
      setShowManualTrigger(true);
    }
  }, [bestPopup, isDismissed, triggerClick]);

  // Click trigger từ admin/sự kiện
  useEffect(() => {
    if (triggerClick && bestPopup && !isDismissed(bestPopup._id)) {
      setCurrentPopup(bestPopup);
      setOpen(true);
    }
  }, [triggerClick, bestPopup, isDismissed]);

  const handleClose = () => {
    if (currentPopup) {
      markDismissed(currentPopup._id);
    }
    setOpen(false);
  };

  if (!bestPopup || !bestPopup.isActive) return null;

  return (
    <>
      {/* Manual trigger button for click-type popups */}
      {showManualTrigger && !open && bestPopup.triggerType === "click" && (
        <Button
          className="fixed bottom-20 right-4 sm:right-6 z-50 rounded-full shadow-lg animate-bounce gap-2"
          onClick={() => {
            setCurrentPopup(bestPopup);
            setOpen(true);
          }}
        >
          {bestPopup.type === "promotion" ? (
            <Gift className="size-4" />
          ) : (
            <Bell className="size-4" />
          )}
          {bestPopup.title}
        </Button>
      )}

      {/* Popup Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden" showCloseButton={false}>
          {/* Promotion type: image + CTA */}
          {currentPopup?.type === "promotion" && (currentPopup.imageUrl || currentPopup.imageMobileUrl) ? (
            <div className="relative">
              <picture>
                <source
                  media="(max-width: 640px)"
                  srcSet={currentPopup.imageMobileUrl || currentPopup.imageUrl}
                />
                <img
                  src={currentPopup.imageUrl}
                  alt={currentPopup.title}
                  className="w-full object-cover"
                  style={{ maxHeight: "70vh" }}
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white text-xl font-bold mb-2">{currentPopup.title}</h3>
                {currentPopup.ctaText && currentPopup.ctaLink && (
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={() => {
                      window.location.href = currentPopup.ctaLink!;
                    }}
                  >
                    {currentPopup.ctaText}
                  </Button>
                )}
              </div>
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 size-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            /* Notification type or fallback */
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bell className="size-5 text-blue-500" />
                  {currentPopup?.title}
                </DialogTitle>
              </DialogHeader>
              {currentPopup?.content && (
                <div
                  className="mt-4 prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: currentPopup.content }}
                />
              )}
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={handleClose}>
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PopupRenderer;
