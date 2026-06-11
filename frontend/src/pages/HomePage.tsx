import { useEffect, useState } from "react";
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
import { useSiteConfig } from "@/hooks/usePublicSiteConfig";
import type { Account } from "@/types";
import type { Banner } from "@/types/admin/ui.type";
import {
  Flame,
  Star,
  ChevronRight,
  Tag,
  Gamepad2,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   Main Banner / Carousel
   ════════════════════════════════════════════════════════════════════ */
const MainBanner = () => {
  const { siteConfig } = useSiteConfig();
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

  if (isLoading) {
    return <Skeleton className="h-[375px] md:h-[540px] w-full rounded-2xl" />;
  }

  // Fallback banner
  if (banners.length === 0) {
    const shopName = siteConfig?.shopName || "ShopSam";
    const description = siteConfig?.description || "Mua bán tài khoản game uy tín";
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
                {shopName}
              </span>
            </h1>
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
              <span className="text-lg">✨</span>
              <span className="font-semibold text-sm">{description}</span>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div
      className="relative overflow-hidden h-[375px] md:h-[540px] rounded-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {banners.map((banner, idx) => (
        <picture key={idx}>
          <source
            media="(max-width: 640px)"
            srcSet={banner.imageMobileUrl || banner.imageDesktopUrl}
          />
          <img
            src={banner.imageDesktopUrl}
            alt={banner.title || banner.headline}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${idx === currentIndex ? "opacity-100" : "opacity-0"}`}
          />
        </picture>
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
                <Badge className="absolute top-1.5 left-1.5 bg-red-500 text-[11px] px-2 py-0.5 h-auto border-0 z-10">
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
            <CardContent className="p-3 space-y-1">
              <p className="text-sm font-semibold line-clamp-1 group-hover:text-blue-600 transition-colors">
                {acc.title}
              </p>
              {acc.attributes?.code && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-hidden">
                  <Tag className="size-3 shrink-0" />
                  <span className="font-mono truncate min-w-0">{acc.attributes.code}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                {acc.attributes?.originalPrice ? (
                  <div>
                    <p className="text-xs text-muted-foreground line-through">
                      {acc.attributes.originalPrice.toLocaleString("vi-VN")}đ
                    </p>
                    <p className="text-sm font-bold text-red-600">
                      {acc.price.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-red-600">
                    {acc.price.toLocaleString("vi-VN")}đ
                  </p>
                )}
                {acc.rating && acc.rating.count > 0 && (
                  <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                    <Star className="size-3 fill-yellow-400 text-yellow-400" />
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

      {/* ─── Popular Products ─── */}
      <PopularProducts />

      {/* ─── Game Product Sections ─── */}
      <section id="products" className="scroll-mt-20">
        <GameProductSections />
      </section>

      {/* ─── Popup Renderer ─── */}
      <PopupRenderer currentPage="home" />


    </div>
  );
}
