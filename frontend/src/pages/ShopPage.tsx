import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GAME_CATEGORIES } from "@/config/categories";
import { accountService } from "@/services/client/accountService";
import type { Account } from "@/types";
import {
  FilterX,
  PackageX,
  Search,
  Star,
  Tag,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

const ShopPage = () => {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasError, setHasError] = useState(false);

  // State cho Pagination & Filter
  const page = parseInt(searchParams.get("page") || "1");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const searchQuery = searchParams.get("q") || "";
  const sortBy = searchParams.get("sortBy") || "newest";

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Phân tích categorySlug -> game và type filter
  const filterParams = useMemo(() => {
    const params: {
      game?: string;
      type?: string;
      categoryInfo: (CategoryItem & { gameName: string; gameSlug: string }) | null;
    } = { categoryInfo: null };

    if (!categorySlug) return params;

    const matchedGame = GAME_CATEGORIES.find(
      (g) => g.gameSlug === categorySlug,
    );
    if (matchedGame) {
      params.game = matchedGame.gameSlug;
      params.categoryInfo = {
        id: matchedGame.gameSlug,
        name: matchedGame.gameName,
        slug: matchedGame.gameSlug,
        typeValue: "",
        image: "",
        priceFrom: 0,
        stock: 0,
        gameName: matchedGame.gameName,
        gameSlug: matchedGame.gameSlug,
      };
      return params;
    }

    for (const game of GAME_CATEGORIES) {
      const found = game.categories.find((c) => c.slug === categorySlug);
      if (found) {
        params.game = game.gameSlug;
        params.type = found.typeValue;
        params.categoryInfo = {
          ...found,
          gameName: game.gameName,
          gameSlug: game.gameSlug,
        };
        return params;
      }
    }

    return params;
  }, [categorySlug]);

  const { game: filterGame, type: filterType, categoryInfo } = filterParams;

  // Fetch data khi params thay đổi
  useEffect(() => {
    const fetchAccount = async () => {
      try {
        setLoading(true);
        setHasError(false);

        const res = await accountService.getAll({
          page,
          limit: 12,
          game: filterGame,
          type: filterType,
          minPrice: minPrice ? parseInt(minPrice) : undefined,
          maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
          search: searchQuery || undefined,
          sortBy: sortBy as "price_asc" | "price_desc" | "newest" | undefined,
        });

        setAccounts(res.accounts || []);
        setTotalItems(res.totalItems || 0);
        setTotalPages(res.totalPages || 1);
      } catch (error) {
        console.error("Error fetching accounts:", error);
        setHasError(true);
        setAccounts([]);
        toast.error("Không thể tải danh sách tài khoản. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [filterGame, filterType, page, minPrice, maxPrice, searchQuery, sortBy]);

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === "" || value === "all") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleReset = () => {
    const newParams = new URLSearchParams();
    setSearchParams(newParams);
    setLocalSearch("");
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateFilter("q", localSearch.trim() || null);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters = minPrice || maxPrice || searchQuery || sortBy !== "newest";

  const priceRanges = [
    { value: "all", label: "Tất cả" },
    { value: "0-50000", label: "Dưới 50.000đ" },
    { value: "50000-100000", label: "50K - 100K" },
    { value: "100000-300000", label: "100K - 300K" },
    { value: "300000-500000", label: "300K - 500K" },
    { value: "500000-9999999", label: "Trên 500K" },
  ];

  const currentPriceValue =
    minPrice || maxPrice
      ? `${minPrice || 0}-${maxPrice || 9999999}`
      : "all";

  if (loading) {
    return (
      <div className="py-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full size-16 border-4 border-blue-200 border-t-blue-600 mx-auto shadow-glow-sm"></div>
          <p className="text-muted-foreground text-base animate-pulse">
            Đang tải thông tin...
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="py-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">😕</div>
          <h2 className="text-2xl font-bold text-destructive">Có lỗi xảy ra</h2>
          <p className="text-muted-foreground text-sm">
            Không thể tải danh sách tài khoản. Vui lòng thử lại sau.
          </p>
          <GradientButton onClick={() => window.location.reload()} className="h-11">
            <Sparkles className="size-4 mr-1" />
            Thử lại
          </GradientButton>
        </div>
      </div>
    );
  }

  if (accounts.length === 0 && !loading && !hasError) {
    return (
      <div className="py-8">
        <div className="min-h-[60vh] flex items-center justify-center">
          <GlassCard className="max-w-lg p-8 text-center">
            <div className="space-y-5">
              <div className="inline-flex items-center justify-center size-20 rounded-full bg-muted/30 mx-auto">
                <PackageX className="size-10 text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">
                  Chưa có tài khoản nào
                </h2>
                <p className="text-sm text-muted-foreground">
                  {categoryInfo
                    ? `Danh mục "${categoryInfo.name}" hiện chưa có tài khoản nào.`
                    : "Hiện chưa có tài khoản nào trong kho."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="gap-1.5"
                >
                  ← Về trang chủ
                </Button>
                <Button onClick={handleReset} variant="secondary">
                  Đặt lại bộ lọc
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          {categoryInfo ? categoryInfo.name : "Tất cả tài khoản"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          <strong className="text-foreground font-semibold">{totalItems}</strong> sản phẩm
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="ml-3 text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <FilterX className="size-3" />
              Xoá bộ lọc
            </button>
          )}
        </p>
      </div>

      {/* ─── Filters Bar ─── */}
      <div className="glass-strong rounded-xl border-border/50 transition-all duration-200">
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 sm:flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm tài khoản, mã code..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9 h-10 bg-muted/30 border-border/50 focus:border-blue-400 transition-all duration-200"
              />
            </div>
            <Button type="submit" size="icon" className="size-10 bg-gradient-brand text-white hover:bg-gradient-brand-hover shrink-0">
              <Search className="size-4" />
            </Button>
          </form>

          {/* Filters row: Price + Sort + Reset */}
          <div className="flex items-center gap-2">
            {/* Price Range */}
            <Select
              value={currentPriceValue}
              onValueChange={(v) => {
                if (v === "all") {
                  updateFilter("minPrice", null);
                  updateFilter("maxPrice", null);
                } else {
                  const [min, max] = v.split("-");
                  updateFilter("minPrice", min);
                  updateFilter("maxPrice", max);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px] h-10">
                <SelectValue placeholder="Giá" />
              </SelectTrigger>
              <SelectContent>
                {priceRanges.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(v) => updateFilter("sortBy", v === "newest" ? null : v)}
            >
              <SelectTrigger className="w-full sm:w-[140px] h-10">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="price_asc">Giá thấp → cao</SelectItem>
                <SelectItem value="price_desc">Giá cao → thấp</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset */}
            {hasActiveFilters && (
              <Button
                onClick={handleReset}
                variant="ghost"
                size="icon"
                className="size-10 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 shrink-0"
              >
                <FilterX className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {accounts.map((acc, idx) => (
          <div
            key={acc.id}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
          <Card
            className="group h-full overflow-hidden border border-border/50 bg-background/80 backdrop-blur-sm hover:border-blue-400 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => navigate(`/tai-khoan/${categorySlug || acc.game}/${acc.id}`)}
          >
            {/* Image area */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              {acc.images?.[0] ? (
                <img
                  src={acc.images[0]}
                  alt={acc.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-4xl">🎮</span>
                </div>
              )}
              {acc.attributes?.discount && (
                <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 border-0">
                  -{acc.attributes.discount}%
                </Badge>
              )}
              {acc.rating && acc.rating.count > 0 && (
                <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600 border-0 flex items-center gap-0.5">
                  <Star className="size-2.5 fill-white" />
                  {acc.rating.avg}
                </Badge>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <CardContent className="p-3 space-y-2.5">
              <h3 className="font-semibold text-sm sm:text-base line-clamp-2 min-h-[40px] group-hover:text-blue-600 transition-colors">
                {acc.title}
              </h3>

              {acc.attributes?.code && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded overflow-hidden">
                  <Tag className="size-3 shrink-0" />
                  <span className="font-mono truncate min-w-0">{acc.attributes.code}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {acc.type && (
                  <Badge variant="secondary" className="text-[11px] px-2 py-0.5 h-auto">
                    {acc.type}
                  </Badge>
                )}
                {!acc.isSold && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[11px] px-2 py-0.5 h-auto border-0">
                    Còn hàng
                  </Badge>
                )}
              </div>

              <div className="flex items-end justify-between">
                <div>
                  {acc.attributes?.originalPrice && (
                    <p className="text-xs text-muted-foreground line-through">
                      {acc.attributes.originalPrice.toLocaleString("vi-VN")}đ
                    </p>
                  )}
                  <p className="text-base sm:text-lg font-bold text-red-600">
                    {acc.price.toLocaleString("vi-VN")}đ
                  </p>
                </div>
                {acc.rating && acc.rating.count > 0 && (
                  <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                    <Star className="size-3 fill-yellow-400 text-yellow-400" />
                    {acc.rating.avg}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1.5 border-t border-border/30">
                <GradientButton
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/tai-khoan/${categorySlug || acc.game}/${acc.id}`);
                  }}
                >
                  Mua ngay
                </GradientButton>
              </div>
            </CardContent>
          </Card>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination>
            <PaginationContent className="gap-1.5">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) handlePageChange(page - 1);
                  }}
                  className={"rounded-lg border border-border/50 hover:border-blue-300 transition-all duration-200 " + (page === 1 ? "pointer-events-none opacity-40" : "")}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => {
                  const shouldShow =
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1);
                  if (shouldShow) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNum);
                          }}
                          isActive={page === pageNum}
                          className={`rounded-lg border transition-all duration-200 ${
                            page === pageNum
                              ? "bg-gradient-brand text-white border-0 shadow-glow-sm"
                              : "border-border/50 hover:border-blue-300 hover:text-blue-600"
                          }`}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (pageNum === page - 2 || pageNum === page + 2) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationEllipsis className="text-muted-foreground" />
                      </PaginationItem>
                    );
                  }
                  return null;
                },
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) handlePageChange(page + 1);
                  }}
                  className={"rounded-lg border border-border/50 hover:border-blue-300 transition-all duration-200 " + (page === totalPages ? "pointer-events-none opacity-40" : "")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
