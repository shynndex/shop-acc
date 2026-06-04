import { useQuery } from "@tanstack/react-query";
import { uiService } from "@/services/client/uiService";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Sparkles } from "lucide-react";

const ScrollingMarquee = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["ui", "scrolling-text"],
    queryFn: () => uiService.getScrollingText(),
    staleTime: 10 * 60 * 1000,
  });

  const text = data?.text || "";
  const isActive = data?.isActive ?? true;

  if (isLoading) {
    return (
      <div className="w-full overflow-hidden rounded-xl">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!text || !isActive) return null;

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
          <div className="flex animate-marquee hover:[animation-play-state:paused]">
            {/* Duplicate for seamless loop */}
            <span className="whitespace-nowrap text-xs sm:text-sm font-medium text-foreground/80 px-4">
              {text}  ·  {text}  ·  {text}  ·  {text}
            </span>
            <span className="whitespace-nowrap text-xs sm:text-sm font-medium text-foreground/80 px-4">
              {text}  ·  {text}  ·  {text}  ·  {text}
            </span>
          </div>
        </div>

        {/* Right side separator */}
        <div className="hidden sm:flex items-center gap-2 ml-3 shrink-0 pl-3 border-l border-foreground/10">
          <AlertCircle className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            ShopSam
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScrollingMarquee;
