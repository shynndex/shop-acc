import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { uiService } from "@/services/client/uiService";
import { accountService } from "@/services/client/accountService";
import {
  Star,
  ChevronRight,
  Gamepad2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
  Gem,
  Layers,
  Sword,
  Crosshair,
} from "lucide-react";
import type { Account } from "@/types";
import type { GameCategory, CategoryItem } from "@/types/admin/ui.type";

// ─── Icon mapping for category types ───────────────────────────────────
const TYPE_ICONS: Record<string, React.ReactNode> = {
  trang: <Gem className="size-4" />,
  "thong-tin-dep": <Gem className="size-4" />,
  reg: <Layers className="size-4" />,
  rlp: <Sparkles className="size-4" />,
  rank: <TrendingUp className="size-4" />,
  "rank-cung": <TrendingUp className="size-4" />,
  skin: <ShieldCheck className="size-4" />,
  "full-skin": <ShieldCheck className="size-4" />,
  vip: <Zap className="size-4" />,
  "vip-bundle": <Zap className="size-4" />,
  standard: <Sword className="size-4" />,
  default: <Crosshair className="size-4" />,
};

function getTypeIcon(typeValue: string): React.ReactNode {
  return TYPE_ICONS[typeValue] || TYPE_ICONS.default;
}

// ─── Mini Account Card ────────────────────────────────────────────────
const MiniAccountCard = ({ acc, index }: { acc: Account; index: number }) => {
  const navigate = useNavigate();

  return (
    <div
      className="group cursor-pointer animate-in fade-in slide-in-from-bottom-3 duration-400"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => navigate(`/tai-khoan/${acc.game}/${acc.id}`)}
    >
      <Card className="overflow-hidden border-2 border-transparent hover:border-blue-400 hover:shadow-lg transition-all duration-300 h-full">
        <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative flex items-center justify-center">
          {acc.images?.[0] ? (
            <img
              src={acc.images[0]}
              alt={acc.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <Gamepad2 className="size-10 text-gray-300" />
          )}
          {acc.attributes?.discount && (
            <Badge className="absolute top-1.5 left-1.5 bg-red-500 text-[10px] px-1.5 py-0.5 h-auto">
              -{acc.attributes.discount}%
            </Badge>
          )}
          {acc.rating?.count > 0 && (
            <Badge className="absolute top-1.5 right-1.5 bg-yellow-500 text-[10px] px-1.5 py-0.5 h-auto flex items-center gap-0.5">
              <Star className="size-2.5 fill-white" />
              {acc.rating.avg}
            </Badge>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <CardContent className="p-2.5">
          <p className="text-xs font-semibold line-clamp-1 group-hover:text-blue-600 transition-colors">
            {acc.title}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            {acc.attributes?.originalPrice ? (
              <div>
                <p className="text-[10px] text-muted-foreground line-through">
                  {acc.attributes.originalPrice.toLocaleString("vi-VN")}đ
                </p>
                <p className="text-xs font-bold text-red-600">
                  {acc.price.toLocaleString("vi-VN")}đ
                </p>
              </div>
            ) : (
              <p className="text-xs font-bold text-red-600">
                {acc.price.toLocaleString("vi-VN")}đ
              </p>
            )}
            {acc.rating?.count > 0 && (
              <span className="text-[10px] text-yellow-600 flex items-center gap-0.5">
                <Star className="size-3 fill-yellow-400 text-yellow-400" />
                {acc.rating.avg}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Category Group Card ──────────────────────────────────────────────
const CategoryGroupCard = ({
  cat,
  gameSlug,
  index,
}: {
  cat: CategoryItem;
  gameSlug: string;
  index: number;
}) => {
  const navigate = useNavigate();

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <Card
        className="overflow-hidden group cursor-pointer border-2 border-transparent hover:border-orange-400 hover:shadow-xl transition-all duration-300 h-full"
        onClick={() => navigate(`/tai-khoan/${cat.slug}`)}
      >
        <div className="relative aspect-[4/3] sm:aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <img
            src={cat.image}
            alt={cat.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = `https://placehold.co/400x250/1e293b/ffffff?text=${encodeURIComponent(cat.name)}`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <Badge className="bg-gradient-to-br from-amber-500 to-orange-600 border-0 text-white shadow-lg">
              {getTypeIcon(cat.typeValue)}
              <span className="ml-1">Chỉ từ {cat.priceFrom.toLocaleString("vi-VN")}đ</span>
            </Badge>
          </div>
        </div>

        <CardContent className="p-3 space-y-2">            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 line-clamp-2 min-h-[36px] group-hover:text-orange-600 transition-colors">
            {cat.name}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Gamepad2 className="size-3" />
              <span>
                Còn <strong className="text-red-600">{cat.stock}</strong> nick
              </span>
            </div>
            <Button
              variant="ghost"
              size="xs"
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/tai-khoan/${cat.slug}`);
              }}
            >
              Xem
              <ChevronRight className="size-3 ml-0.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Account Skeleton ────────────────────────────────────────────────
const AccountSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="space-y-2 animate-in fade-in duration-300"
        style={{ animationDelay: `${i * 80}ms` }}
      >
        <div className="relative overflow-hidden rounded-xl">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))}
  </div>
);

// ─── Single Game Section ──────────────────────────────────────────────
const GameSectionBlock = ({
  gameCategories,
  accounts,
  index,
  accountsLoading,
}: {
  gameCategories: GameCategory | null;
  accounts: Account[];
  index: number;
  accountsLoading?: boolean;
}) => {
  const navigate = useNavigate();

  // Get game info from either source
  const gameSlug = gameCategories?.gameSlug || accounts[0]?.game || "";
  const gameName = gameCategories?.gameName || gameSlug.toUpperCase();
  const gameIcon = gameCategories?.gameIcon || "🎮";
  const categories = gameCategories?.categories?.filter((c) => c.isActive) || [];

  // Group accounts by type for display
  const accountsByType = useMemo(() => {
    const map = new Map<string, Account[]>();
    for (const acc of accounts) {
      const type = acc.type || "standard";
      if (!map.has(type)) map.set(type, []);
      map.get(type)!.push(acc);
    }
    return map;
  }, [accounts]);

  return (
    <div
      className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 pb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl sm:text-3xl">{gameIcon}</span>
          <div>
            <h2 className="text-base sm:text-xl md:text-2xl font-bold uppercase tracking-wide text-gray-800 dark:text-gray-100">
              {gameName}
            </h2>              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {categories.length} danh mục · {accountsByType.size} loại tài khoản
              </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium"
          onClick={() => navigate(`/tai-khoan/${gameSlug}`)}
        >
          Xem tất cả
          <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>

      {/* Category Groups */}
      {categories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, idx) => (
            <CategoryGroupCard
              key={cat.id}
              cat={cat}
              gameSlug={gameSlug}
              index={idx}
            />
          ))}
        </div>
      )}

      {/* Sample Accounts */}
      {accountsLoading || accounts.length > 0 ? (
        <div className="space-y-3">
          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Tài khoản mới nhất
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>
          )}
          {accountsLoading ? (
            <AccountSkeleton count={Math.min(categories.length || 4, 4)} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {accounts.slice(0, 4).map((acc, idx) => (
                <MiniAccountCard key={acc.id} acc={acc} index={idx} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────
const SectionSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 2 }).map((_, i) => (
      <div key={i} className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="aspect-video w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────
const GameProductSections = () => {
  // Fetch categories (game + category data)
  const {
    data: catData,
    isLoading: catLoading,
  } = useQuery({
    queryKey: ["ui", "categories"],
    queryFn: () => uiService.getCategories(),
    staleTime: 30 * 60 * 1000,
  });

  // Fetch accounts by game (now also useQuery — with caching)
  const {
    data: accData,
    isLoading: accLoading,
  } = useQuery({
    queryKey: ["accounts", "by-game", 4],
    queryFn: () => accountService.getByGame(4),
    staleTime: 5 * 60 * 1000,
  });

  const allGames: GameCategory[] = catData?.games || [];
  const accountSections = useMemo(() => {
    const sections = accData?.sections;
    return Array.isArray(sections) ? sections : [];
  }, [accData]);

  const accountsLoading = accLoading;
  const showFullSkeleton = catLoading && allGames.length === 0;

  // Build merged sections: for each category game, find matching accounts
  const mergedSections = useMemo(() => {
    if (allGames.length === 0 && accountSections.length === 0) return [];

    // Create a map of gameSlug → accounts
    const accountsMap = new Map<string, Account[]>();
    for (const sec of accountSections) {
      accountsMap.set(sec.gameSlug, sec.accounts);
    }

    // First, render games that have categories (from API, in order)
    const seen = new Set<string>();
    const result: {
      gameCategories: GameCategory;
      accounts: Account[];
    }[] = [];

    for (const game of allGames) {
      seen.add(game.gameSlug);
      result.push({
        gameCategories: game,
        accounts: accountsMap.get(game.gameSlug) || [],
      });
    }

    // Then, add any games that only have accounts (no categories)
    for (const sec of accountSections) {
      if (!seen.has(sec.gameSlug)) {
        seen.add(sec.gameSlug);
        // Create a minimal GameCategory-like object
        result.push({
          gameCategories: {
            _id: sec.gameSlug,
            gameSlug: sec.gameSlug,
            gameName: sec.gameName,
            gameIcon: sec.gameIcon,
            iconType: "emoji",
            isActive: true,
            sortOrder: 99,
            categories: [],
            createdAt: "",
            updatedAt: "",
          } as GameCategory,
          accounts: sec.accounts,
        });
      }
    }

    return result;
  }, [allGames, accountSections]);

  if (showFullSkeleton) {
    return (
      <div className="space-y-6">
        <SectionSkeleton />
      </div>
    );
  }

  if (mergedSections.length === 0) return null;

  return (
    <div className="space-y-10">
      {/* Section Title */}
      <div className="text-center space-y-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 uppercase flex items-center justify-center gap-3">
          <Gamepad2 className="size-8 text-blue-600" />
          DANH MỤC TÀI KHOẢN GAME
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Chọn danh mục game và khám phá kho tài khoản chất lượng
        </p>
      </div>

      {mergedSections.map((section, index) => (
        <GameSectionBlock
          key={section.gameCategories.gameSlug}
          gameCategories={section.gameCategories}
          accounts={section.accounts}
          accountsLoading={accountsLoading}
          index={index}
        />
      ))}
    </div>
  );
};

export default GameProductSections;
