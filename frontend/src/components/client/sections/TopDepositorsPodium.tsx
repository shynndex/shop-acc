import { useQuery } from "@tanstack/react-query";
import { accountService } from "@/services/client/accountService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { Trophy, Medal, Gem, Crown } from "lucide-react";
import { cn, formatVND } from "@/lib/utils";

/* ─── Helpers ─── */
const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const maskName = (name: string) => {
  if (name.length <= 2) return name;
  return name.slice(0, 2) + "***" + name.slice(-1);
};

/* ─── Rank Badge Config ─── */
const RANK_CONFIG = [
  { place: 1, label: "Huyền thoại", icon: Crown, gradient: "from-amber-400 to-yellow-600", shadow: "shadow-amber-500/30", barColor: "bg-gradient-to-r from-amber-400 to-yellow-500" },
  { place: 2, label: "Kim cương", icon: Medal, gradient: "from-sky-400 to-blue-500", shadow: "shadow-sky-500/20", barColor: "bg-gradient-to-r from-sky-400 to-blue-500" },
  { place: 3, label: "Vàng", icon: Medal, gradient: "from-orange-400 to-amber-600", shadow: "shadow-orange-500/20", barColor: "bg-gradient-to-r from-orange-400 to-amber-500" },
];

/* ─── Top 3 Podium Card ─── */
const PodiumCard = ({
  depositor,
  rankIndex,
}: {
  depositor: {
    rank: number;
    displayName: string;
    avatarUrl: string | null;
    totalDeposited: number;
  };
  rankIndex: number;
}) => {
  const config = RANK_CONFIG[rankIndex] || RANK_CONFIG[2];
  const Icon = config.icon;
  const isFirst = rankIndex === 0;
  const isSecond = rankIndex === 1;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 sm:gap-2 transition-all duration-300 hover:scale-105",
        isFirst ? "order-2" : isSecond ? "order-1" : "order-3",
      )}
    >
      {/* Crown for 1st */}
      {isFirst && (
        <div className="animate-bounce">
          <Crown className="size-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
        </div>
      )}

      {/* Avatar */}
      <div className="relative">
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-md opacity-60",
            `bg-gradient-to-b ${config.gradient}`,
          )}
        />
        <Avatar
          className={cn(
            "relative size-12 sm:size-14 md:size-16 ring-2 ring-white dark:ring-gray-800 shadow-lg",
            isFirst && "size-14 sm:size-16 md:size-20 ring-4",
            config.shadow,
          )}
        >
          {depositor.avatarUrl ? (
            <AvatarImage src={depositor.avatarUrl} alt={depositor.displayName} />
          ) : null}
          <AvatarFallback
            className={cn(
              `bg-gradient-to-br ${config.gradient} text-white font-bold text-sm`,
            )}
          >
            {getInitials(depositor.displayName)}
          </AvatarFallback>
        </Avatar>

        {/* Rank badge */}
        <div
          className={cn(
            "absolute -bottom-1 -right-1 size-6 rounded-full flex items-center justify-center text-white shadow",
            `bg-gradient-to-br ${config.gradient}`,
            isFirst && "size-7 -bottom-1 -right-1",
          )}
        >
          <Icon className={cn("size-3.5", isFirst && "size-4")} />
        </div>
      </div>

      {/* Name */}        <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-center truncate max-w-[60px] sm:max-w-[80px] md:max-w-[100px]">
          {maskName(depositor.displayName)}
        </p>

      {/* Amount */}
      <div
        className={cn(
          "rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold text-white shadow",
          `bg-gradient-to-r ${config.gradient}`,
        )}
      >
        {formatVND(depositor.totalDeposited)}đ
      </div>

      {/* Label */}
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {config.label}
      </span>
    </div>
  );
};

/* ─── Main Component ─── */
const TopDepositorsPodium = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["accounts", "top-depositors", 3],
    queryFn: () => accountService.getTopDepositors(3),
    staleTime: 5 * 60 * 1000,
  });

  const depositors = data?.depositors || [];

  if (isLoading) {
    return (
      <GlassCard className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <Trophy className="size-4 sm:size-5 text-amber-500" />
          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider">Top nạp thẻ</h3>
        </div>
        <div className="flex items-end justify-center gap-4 pt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2"
              style={{ marginTop: i === 0 ? 0 : i === 1 ? "1rem" : "0.5rem" }}
            >
              <Skeleton className="size-14 sm:size-16 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (depositors.length === 0) {
    return (
      <GlassCard className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="size-4 sm:size-5 text-amber-500" />
          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider">Top nạp thẻ</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-6">
          Chưa có dữ liệu nạp thẻ
        </p>
      </GlassCard>
    );
  }

  return (      <GlassCard className="p-3 sm:p-5" hover>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="size-5 text-amber-500" />
        <h3 className="font-bold text-sm uppercase tracking-wider">Top nạp thẻ</h3>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-2 sm:gap-3 md:gap-5 pt-2">
        {depositors.map((d, i) => (
          <PodiumCard key={d.userId} depositor={d} rankIndex={i} />
        ))}
      </div>

      {/* Bottom progress bars */}
      {depositors.length >= 3 && (
        <div className="flex items-end justify-center gap-2 mt-4">
          {depositors.slice(0, 3).map((d, i) => {
            const maxAmount = depositors[0]?.totalDeposited || 1;
            const pct = Math.round((d.totalDeposited / maxAmount) * 100);
            const config = RANK_CONFIG[i] || RANK_CONFIG[2];
            return (
              <div key={d.userId} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", config.barColor)}
                    style={{ width: `${Math.max(pct, 10)}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground font-medium">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};

export default TopDepositorsPodium;
