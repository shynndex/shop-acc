import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { uiService } from "@/services/client/uiService";
import { useSiteConfig } from "@/hooks/usePublicSiteConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, AlertCircle } from "lucide-react";

/* ─── SSE connection for real-time marquee events ─────────────── */
const SSE_URL = `${
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : ""
}/api/ui/marquee/stream`;

export interface MarqueeEvent {
  id: number;
  type: "deposit" | "purchase" | "random" | "manual";
  username: string;
  message: string;
  amount: number;
  item: string;
  timestamp: string;
}

/* ─── Dot colour by event type ────────────────────────────────── */
function eventDot(type: MarqueeEvent["type"]): { color: string; label: string } {
  switch (type) {
    case "deposit":
      return { color: "text-green-500", label: "Nạp tiền" };
    case "purchase":
      return { color: "text-blue-500", label: "Mua tài khoản" };
    case "random":
      return { color: "text-purple-500", label: "Quay random" };
    default:
      return { color: "text-amber-500", label: "Thông báo" };
  }
}

/* ─── Render a list of marquee items as React elements ────────── */
function renderMarqueeItems(
  adminText: string,
  events: MarqueeEvent[],
): React.ReactNode[] {
  const items: React.ReactNode[] = [];
  const separator = <span key="sep" className="mx-4 text-muted-foreground/40">·</span>;

  // Admin text first
  if (adminText) {
    items.push(
      <span key="admin" className="whitespace-nowrap text-xs sm:text-sm font-medium text-foreground/80">
        {adminText}
      </span>,
    );
    items.push(separator);
  }

  // Recent events
  const recent = events.slice(-15);
  recent.forEach((ev, i) => {
    const dot = eventDot(ev.type);
    items.push(
      <span key={`ev-${ev.id}`} className="whitespace-nowrap text-xs sm:text-sm font-medium text-foreground/80 inline-flex items-center gap-1.5">
        <span className={`${dot.color} text-[10px]`}>●</span>
        {ev.message}
      </span>,
    );
    if (i < recent.length - 1) {
      items.push(<span key={`sep-${ev.id}`} className="mx-4 text-muted-foreground/40">·</span>);
    }
  });

  return items;
}

/* ════════════════════════════════════════════════════════════════════
   ScrollingMarquee
   ════════════════════════════════════════════════════════════════════ */
const ScrollingMarquee = () => {
  const { shopName, siteConfig } = useSiteConfig();
  const [events, setEvents] = useState<MarqueeEvent[]>([]);
  const latestIdRef = useRef(0);
  const retryRef = useRef(0);

  // ── Fetch admin scrolling text ─────────────────────────────────
  const { data: adminData, isLoading: textLoading } = useQuery({
    queryKey: ["ui", "scrolling-text"],
    queryFn: () => uiService.getScrollingText(),
    staleTime: 10 * 60 * 1000,
  });

  const adminText = adminData?.text || "";
  const isActive = adminData?.isActive ?? true;

  // ── SSE connection for real-time events ────────────────────────
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (eventSource) eventSource.close();

      eventSource = new EventSource(SSE_URL);

      eventSource.addEventListener("marquee_event", (e: MessageEvent) => {
        try {
          const event: MarqueeEvent = JSON.parse(e.data);
          if (event.id > latestIdRef.current) {
            latestIdRef.current = event.id;
            setEvents((prev) => {
              const next = [...prev, event];
              return next.length > 30 ? next.slice(-30) : next;
            });
          }
        } catch {
          // ignore parse errors
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
        retryRef.current = Math.min(retryRef.current + 1, 10);
        const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
        reconnectTimer = setTimeout(connect, delay);
      };

      eventSource.onopen = () => {
        retryRef.current = 0;
      };
    }

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  // ── Determine enabled / speed ─────────────────────────────────
  const isEnabled = siteConfig?.support?.marqueeEnabled ?? isActive;
  const speed = siteConfig?.support?.marqueeSpeed ?? "normal";
  const speedDuration: Record<string, string> = { slow: "40s", normal: "25s", fast: "15s" };
  const duration = speedDuration[speed] || "25s";

  const items = renderMarqueeItems(adminText, events);

  if (textLoading && events.length === 0) {
    return (
      <div className="w-full overflow-hidden rounded-xl">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!isEnabled || items.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-xl group">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-blue-600/10 dark:from-blue-500/5 dark:via-cyan-400/5 dark:to-blue-500/5" />

      {/* Border glow */}
      <div className="absolute inset-0 rounded-xl border border-blue-200/30 dark:border-blue-400/20" />

      {/* Content */}
      <div className="relative flex items-center h-10 sm:h-11 px-3 overflow-hidden">
        {/* Icon */}
        <div className="flex items-center gap-2 shrink-0 mr-3">
          <Sparkles className="size-4 text-blue-500 animate-pulse" />
        </div>

        {/* Marquee track */}
        <div className="flex-1 overflow-hidden">
          <div className="flex" style={{ animation: `marquee ${duration} linear infinite` }}>
            {/* Two copies for seamless loop */}
            <span className="flex items-center px-4 whitespace-nowrap">
              {items}
            </span>
            <span className="flex items-center px-4 whitespace-nowrap">
              {items}
            </span>
          </div>
        </div>

        {/* Right side separator */}
        <div className="hidden sm:flex items-center gap-2 ml-3 shrink-0 pl-3 border-l border-foreground/10">
          <AlertCircle className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {shopName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScrollingMarquee;
