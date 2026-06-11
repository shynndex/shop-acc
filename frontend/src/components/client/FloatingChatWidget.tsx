import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { uiService } from "@/services/client/uiService";
import { MessageCircle, X, Phone, Send, ExternalLink, ChevronDown } from "lucide-react";

/* ─── Contact channel icons & labels ─────────────────────────── */
const CHANNEL_META: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; hoverColor: string; domain?: string }
> = {
  messenger: {
    label: "Messenger",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.733 8.37l3.13 3.259 5.937-3.259-5.607 6.593z" />
      </svg>
    ),
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600",
  },
  zalo: {
    label: "Zalo",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1.828 14.65h-3.657v-1.828h3.657v1.828zm3.656-3.656H8.516v-1.828h8.968v1.828zm0-3.656H8.516V7.51h8.968v1.828z" />
      </svg>
    ),
    color: "bg-blue-600",
    hoverColor: "hover:bg-blue-700",
  },
  telegram: {
    label: "Telegram",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    color: "bg-sky-500",
    hoverColor: "hover:bg-sky-600",
  },
  phone: {
    label: "Gọi điện",
    icon: <Phone className="size-5" />,
    color: "bg-green-500",
    hoverColor: "hover:bg-green-600",
  },
};

/* ─── Extract usable URL from stored value ──────────────────── */
function normalizeUrl(value: string | undefined | null, channel: string): string | null {
  if (!value || value.trim() === "") return null;
  const v = value.trim();

  // Phone: tel: link
  if (channel === "phone") {
    const digits = v.replace(/\D/g, "");
    if (digits.length >= 7) return `tel:${digits}`;
    return null;
  }

  // If it already has a protocol, use as-is
  if (v.startsWith("http://") || v.startsWith("https://")) return v;

  // If it's a short username/handle
  if (channel === "messenger") {
    // Could be a numeric ID or a page name
    if (/^\d+$/.test(v)) return `https://m.me/${v}`;
    return `https://m.me/${v}`;
  }

  if (channel === "zalo") {
    // Could be phone number or ID
    const digits = v.replace(/\D/g, "");
    if (digits.length >= 7) return `https://zalo.me/${digits}`;
    return `https://zalo.me/${v}`;
  }

  if (channel === "telegram") {
    // Remove @ if present
    const handle = v.startsWith("@") ? v.slice(1) : v;
    return `https://t.me/${handle}`;
  }

  return v;
}

/* ════════════════════════════════════════════════════════════════════
   Floating Chat Widget
   ════════════════════════════════════════════════════════════════════ */
export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch contact info from SiteConfig
  const { data: contact, isLoading } = useQuery({
    queryKey: ["ui", "contact-info"],
    queryFn: () => uiService.getContactInfo(),
    staleTime: 5 * 60 * 1000,
  });

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // Build channel list from contact data
  // NOTE: axios interceptor already unwraps { success, data } → contact is the inner object
  const channels: { key: string; url: string; meta: (typeof CHANNEL_META)[string] }[] = [];
  if (contact) {
    for (const [key, meta] of Object.entries(CHANNEL_META)) {
      const url = normalizeUrl((contact as any)[key], key);
      if (url) {
        channels.push({ key, url, meta });
      }
    }
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div ref={panelRef} className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-2 safe-area-bottom">
      {/* ─── Expandable Panel ──────────────────────────────────────── */}
      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">
          <div className="bg-background/90 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/40 overflow-hidden w-[260px] sm:w-[280px]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 text-white">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <MessageCircle className="size-4" />
                  Hỗ trợ khách hàng
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="text-xs text-white/80">Chọn kênh liên hệ phù hợp với bạn</p>
            </div>

            {/* Channels */}
            <div className="p-3 space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 rounded-xl bg-muted/50 animate-pulse"
                    />
                  ))}
                </div>
              ) : channels.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">
                  Chưa có thông tin liên hệ
                </p>
              ) : (
                channels.map((ch) => (
                  <a
                    key={ch.key}
                    href={ch.url}
                    target={ch.key === "phone" ? undefined : "_blank"}
                    rel={ch.key === "phone" ? undefined : "noopener noreferrer"}
                    className={`flex items-center gap-3 p-3 rounded-xl text-white ${ch.meta.color} ${ch.meta.hoverColor} transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md group cursor-pointer`}
                  >
                    <span className="shrink-0 flex items-center justify-center size-8 rounded-full bg-white/20">
                      {ch.meta.icon}
                    </span>
                    <span className="flex-1 font-medium text-sm">{ch.meta.label}</span>
                    <ExternalLink className="size-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-border/40">
              <p className="text-[11px] text-muted-foreground text-center">
                Phản hồi trong vòng 5-15 phút
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Floating Button ───────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          relative h-12 w-12 sm:h-14 sm:w-14 rounded-full
          bg-gradient-to-br from-blue-600 to-cyan-500
          hover:from-blue-500 hover:to-cyan-400
          text-white shadow-lg shadow-blue-500/30
          hover:shadow-blue-500/50
          active:scale-90
          transition-all duration-300 ease-out
          flex items-center justify-center
          ${isOpen ? "rotate-90 scale-110 shadow-blue-500/60" : "hover:scale-110"}
        `}
        aria-label={isOpen ? "Đóng chat" : "Mở chat"}
      >
        {isOpen ? (
          <X className="size-5 sm:size-6 transition-transform duration-300 rotate-0" />
        ) : (
          <>
            <MessageCircle className="size-5 sm:size-6 transition-transform duration-300" />
            {/* Ripple pulse animation */}
            <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping opacity-75" />
          </>
        )}
      </button>
    </div>
  );
}
