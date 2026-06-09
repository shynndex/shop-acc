import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { accountService } from "@/services/client/accountService";
import { uiService } from "@/services/client/uiService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import TopDepositorsPodium from "@/components/client/sections/TopDepositorsPodium";
import ScrollingMarquee from "@/components/client/sections/ScrollingMarquee";
import GameProductSections from "@/components/client/sections/GameProductSections";
import PopupRenderer from "@/components/client/PopupRenderer";
import type { Account } from "@/types";
import type { Banner, GameCategory, CategoryItem } from "@/types/admin/ui.type";
import {
  Flame,
  Star,
  ChevronRight,
  ChevronLeft,
  Tag,
  Gamepad2,
  MessageCircle,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   Main Banner / Carousel
   ════════════════════════════════════════════════════════════════════ */
const MainBanner = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["ui", "banners"],
    queryFn: () => uiService.getBanners(),
    staleTime: 15 * 60 * 1000,
  });

  const banners: Banner[] = data?.banners || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  const goTo = useCallback((index: number) => setCurrentIndex(index), []);
  const goPrev = useCallback(
    () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length),
    [banners.length],
  );
  const goNext = useCallback(
    () => setCurrentIndex((prev) => (prev + 1) % banners.length),
    [banners.length],
  );

  if (isLoading) {
    return <Skeleton className="h-[375px] md:h-[540px] w-full rounded-2xl" />;
  }

  // Fallback banner
  if (banners.length === 0) {
    return (
      <GlassCard className="relative overflow-hidden h-[375px] md:h-[540px] border-0 p-0" gradientBorder>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 rounded-2xl">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-300 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white p-6">
            <h1 className="text-4xl md:text-6xl font-black mb-3 text-center drop-shadow-lg">
              <span className="bg-gradient-to-r from-cyan-300 via-white to-orange-400 bg-clip-text text-transparent">
                SHOPT1
              </span>
              <span className="text-orange-500">.</span>
              <span className="bg-gradient-to-r from-cyan-300 via-white to-cyan-300 bg-clip-text text-transparent">
                COM
              </span>
            </h1>
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
              <span className="text-lg">🎵</span>
              <span className="font-semibold text-sm">MẠNH LÀM SỚP ẠC</span>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div
      className="relative overflow-hidden h-[375px] md:h-[540px] rounded-2xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Image */}
      <picture>
        <source
          media="(max-width: 640px)"
          srcSet={currentBanner.imageMobileUrl || currentBanner.imageDesktopUrl}
        />
        <img
          src={currentBanner.imageDesktopUrl}
          alt={currentBanner.title || currentBanner.headline}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </picture>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 text-white">
        {currentBanner.headline && (
          <h2 className="text-xl md:text-3xl font-bold mb-1 drop-shadow-lg">
            {currentBanner.headline}
          </h2>
        )}
        {currentBanner.description && (
          <p className="text-xs md:text-sm text-white/80 mb-3 max-w-lg drop-shadow">
            {currentBanner.description}
          </p>
        )}
        {currentBanner.ctaText && currentBanner.ctaLink && (
          <Button
            className="bg-gradient-brand text-white hover:bg-gradient-brand-hover text-sm h-9"
            onClick={() => (window.location.href = currentBanner.ctaLink)}
          >
            {currentBanner.ctaText}
          </Button>
        )}
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white opacity-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20 size-8 rounded-full"
            onClick={goPrev}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white opacity-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20 size-8 rounded-full"
            onClick={goNext}
          >
            <ChevronRight className="size-4" />
          </Button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? "bg-white w-5" : "bg-white/50 hover:bg-white/80"
              }`}
              onClick={() => goTo(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════
   Game Categories Grid
   ════════════════════════════════════════════════════════════════════ */
const GameCategories = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["ui", "categories"],
    queryFn: () => uiService.getCategories(),
    staleTime: 30 * 60 * 1000,
  });

  const games = data?.games || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2 animate-in fade-in duration-300" style={{ animationDelay: `${i * 60}ms` }}>
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <Skeleton className="h-3 w-3/4 mx-1" />
            <div className="flex items-center justify-between px-1">
              <Skeleton className="h-4 w-10 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (games.length === 0) return null;

  // Featured games (first 6)
  const featuredGames = games.slice(0, 6);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {featuredGames.map((game: GameCategory) => (
        <Card
          key={game.gameSlug}
          className="overflow-hidden group cursor-pointer border border-border/50 hover:border-blue-400 hover:shadow-lg transition-all duration-300 bg-background/80 backdrop-blur-sm"
          onClick={() => navigate(`/tai-khoan/${game.gameSlug}`)}
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
            {game.iconType === "image" && game.gameIcon ? (
              <img
                src={game.gameIcon}
                alt={game.gameName}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                {game.gameIcon}
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
          <CardContent className="p-2.5 space-y-1.5">
            <h3 className="font-bold text-xs line-clamp-1">{game.gameName}</h3>
            <div className="flex items-center justify-between">
              <Badge className="bg-gradient-brand text-white text-[9px] px-2 py-0.5 h-auto border-0">
                {game.categories?.length || 0} loại
              </Badge>
              {game.categories?.length > 0 && (
                <span className="text-[10px] font-semibold text-red-600">
                  {Math.min(
                    ...game.categories.map((c: CategoryItem) => c.priceFrom),
                  ).toLocaleString("vi-VN")}
                  đ
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════
   Popular Products
   ════════════════════════════════════════════════════════════════════ */
const PopularProducts = () => {
  const navigate = useNavigate();
  const [popularAccounts, setPopularAccounts] = useState<Account[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);

  useEffect(() => {
    accountService
      .getSuggestions({ type: "popular", limit: 6 })
      .then((data) => setPopularAccounts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setPopularLoading(false));
  }, []);

  if (popularLoading || popularAccounts.length === 0) return null;

  return (
    <section id="popular" className="scroll-mt-20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="size-5 text-orange-500" />
            Sản phẩm bán chạy
          </h2>
          <p className="text-xs text-muted-foreground">
            Những tài khoản được giao dịch nhiều nhất
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 text-xs"
          onClick={() => navigate("/tai-khoan")}
        >
          Xem tất cả <ChevronRight className="size-3 ml-0.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {popularAccounts.map((acc) => (
          <Card
            key={acc.id}
            className="group cursor-pointer border border-border/50 hover:border-blue-400 hover:shadow-md transition-all duration-300 overflow-hidden bg-background/80 backdrop-blur-sm"
            onClick={() => navigate(`/tai-khoan/${acc.game}/${acc.id}`)}
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 overflow-hidden relative">
              {acc.attributes?.discount && (
                <Badge className="absolute top-1.5 left-1.5 bg-red-500 text-[9px] px-1.5 py-0.5 h-auto border-0 z-10">
                  -{acc.attributes.discount}%
                </Badge>
              )}
              {acc.images?.[0] ? (
                <img
                  src={acc.images[0]}
                  alt={acc.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-2xl">
                  <Gamepad2 className="size-8 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <CardContent className="p-2.5 space-y-1">
              <p className="text-xs font-semibold line-clamp-1 group-hover:text-blue-600 transition-colors">
                {acc.title}
              </p>
              {acc.attributes?.code && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Tag className="size-2.5" />
                  <span className="font-mono">{acc.attributes.code}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
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
                {acc.rating && acc.rating.count > 0 && (
                  <span className="text-[10px] text-yellow-600 flex items-center gap-0.5">
                    <Star className="size-2.5 fill-yellow-400 text-yellow-400" />
                    {acc.rating.avg}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

/* ════════════════════════════════════════════════════════════════════
   Home Page
   ════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div className="py-4 space-y-10 sm:space-y-14">
      {/* ─── Top Section: Carousel + Podium side-by-side ─── */}
      <section id="hero" className="scroll-mt-20 flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6">
        {/* Carousel — 60% on desktop */}
        <div className="flex-1 min-w-0 lg:w-3/5">
          <MainBanner />
        </div>

        {/* Podium — 40% on desktop */}
        <div className="lg:w-2/5 shrink-0">
          <TopDepositorsPodium />
        </div>
      </section>

      {/* ─── Scrolling Marquee ─── */}
      <ScrollingMarquee />

      {/* ─── Game Categories ─── */}
      <section id="categories" className="scroll-mt-20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="size-4 sm:size-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">
              Danh mục game
            </h2>
          </div>
        </div>
        <GameCategories />
      </section>

      {/* ─── Popular Products ─── */}
      <PopularProducts />

      {/* ─── Game Product Sections ─── */}
      <section id="products" className="scroll-mt-20">
        <GameProductSections />
      </section>

      {/* ─── Popup Renderer ─── */}
      <PopupRenderer currentPage="home" />

      {/* ─── Floating Chat Button ─── */}
      <Button
        size="icon"
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-gradient-brand text-white hover:bg-gradient-brand-hover shadow-lg shadow-blue-500/30 z-40 hover:scale-110 active:scale-95 transition-all duration-200 safe-area-bottom"
      >
        <MessageCircle className="size-5 sm:size-5" />
      </Button>
    </div>
  );
}
