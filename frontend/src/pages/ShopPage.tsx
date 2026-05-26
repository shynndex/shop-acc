import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { GAME_CATEGORIES } from "@/config/categories";
import { accountService } from "@/services/client/accountService";
import type { Account } from "@/types";
import type { FilterOptions } from "@/types/client/services";
import {
  Filter,
  FilterX,
  GitCompareArrows,
  PackageX,
  Search,
  Star,
  Tag,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useCompareStore } from "@/stores/useCompareStore";

const ShopPage = () => {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const compareStore = useCompareStore();

  // State cho Pagination & Filter
  const page = parseInt(searchParams.get("page") || "1");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const rankFilter = searchParams.get("rank") || "";
  const minSkins = searchParams.get("minSkins") || "";
  const minHeroes = searchParams.get("minHeroes") || "";
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

    // Trường hợp 1: categorySlug khớp với gameSlug (VD: /tai-khoan/lien-quan)
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

    // Trường hợp 2: categorySlug khớp với category.slug
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

  // Fetch filter options when game changes
  useEffect(() => {
    if (filterGame) {
      accountService
        .getFilterOptions(filterGame)
        .then(setFilterOptions)
        .catch(() => {});
    } else {
      setFilterOptions(null);
    }
  }, [filterGame]);

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
          rank: rankFilter || undefined,
          minSkins: minSkins ? parseInt(minSkins) : undefined,
          minHeroes: minHeroes ? parseInt(minHeroes) : undefined,
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
  }, [filterGame, filterType, page, minPrice, maxPrice, rankFilter, minSkins, minHeroes, searchQuery, sortBy]);

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

  const hasActiveFilters = minPrice || maxPrice || rankFilter || minSkins || minHeroes || searchQuery || sortBy !== "newest";

  // ─── Filter Panel Component ────────────────────────────────────────────

  const FilterPanel = ({ vertical = false }: { vertical?: boolean }) => (
    <div className={vertical ? "space-y-6" : "flex flex-wrap items-end gap-4"}>
      {/* Price Filter */}
      <div className={vertical ? "" : "min-w-[160px]"}>
        <label className="block text-sm font-medium mb-2">Khoảng giá</label>
        <Select
          value={
            minPrice || maxPrice
              ? `${minPrice || 0}-${maxPrice || 9999999}`
              : "all"
          }
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
          <SelectTrigger>
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="0-50000">Dưới 50.000đ</SelectItem>
            <SelectItem value="50000-100000">50.000đ - 100.000đ</SelectItem>
            <SelectItem value="100000-300000">100.000đ - 300.000đ</SelectItem>
            <SelectItem value="300000-500000">300.000đ - 500.000đ</SelectItem>
            <SelectItem value="500000-9999999">Trên 500.000đ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rank Filter */}
      {filterOptions?.ranks && filterOptions.ranks.length > 0 && (
        <div className={vertical ? "" : "min-w-[160px]"}>
          <label className="block text-sm font-medium mb-2">Rank</label>
          <Select
            value={rankFilter || "all"}
            onValueChange={(v) => updateFilter("rank", v === "all" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tất cả rank" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả rank</SelectItem>
              {filterOptions.ranks.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Skin Count Filter */}
      {filterOptions?.skinRange && (
        <div className={vertical ? "" : "min-w-[160px]"}>
          <label className="block text-sm font-medium mb-2">
            Skin {minSkins ? `≥ ${minSkins}` : ""}
          </label>
          <Select
            value={minSkins || "all"}
            onValueChange={(v) => updateFilter("minSkins", v === "all" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {[1, 5, 10, 20, 50, 100, 200].map(
                (n) =>
                  n <= (filterOptions.skinRange?.max || 999) && (
                    <SelectItem key={n} value={String(n)}>
                      {n}+
                    </SelectItem>
                  ),
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Hero Count Filter */}
      {filterOptions?.heroRange && (
        <div className={vertical ? "" : "min-w-[160px]"}>
          <label className="block text-sm font-medium mb-2">
            Tướng {minHeroes ? `≥ ${minHeroes}` : ""}
          </label>
          <Select
            value={minHeroes || "all"}
            onValueChange={(v) => updateFilter("minHeroes", v === "all" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {[10, 30, 50, 80, 100, 120].map(
                (n) =>
                  n <= (filterOptions.heroRange?.max || 999) && (
                    <SelectItem key={n} value={String(n)}>
                      {n}+
                    </SelectItem>
                  ),
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Sort */}
      <div className={vertical ? "" : "min-w-[140px]"}>
        <label className="block text-sm font-medium mb-2">Sắp xếp</label>
        <Select
          value={sortBy}
          onValueChange={(v) => updateFilter("sortBy", v === "newest" ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Mới nhất" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="price_asc">Giá: Thấp → Cao</SelectItem>
            <SelectItem value="price_desc">Giá: Cao → Thấp</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full size-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-muted-foreground text-lg animate-pulse">
            Đang tải thông tin...
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">😕</div>
          <h2 className="text-2xl font-bold text-red-600">Có lỗi xảy ra</h2>
          <p className="text-muted-foreground">
            Không thể tải danh sách tài khoản. Vui lòng thử lại sau.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (accounts.length === 0 && !loading && !hasError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-6 max-w-lg">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-4">
              <PackageX className="h-12 w-12 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-800">
                Chưa có tài khoản nào
              </h2>
              <p className="text-muted-foreground text-lg">
                {categoryInfo
                  ? `Danh mục "${categoryInfo.name}" hiện chưa có tài khoản nào.`
                  : "Hiện chưa có tài khoản nào trong kho."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="border-2"
              >
                ← Về trang chủ
              </Button>
              <Button onClick={handleReset} variant="secondary">
                Đặt lại bộ lọc
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {categoryInfo ? categoryInfo.name : "TẤT CẢ TÀI KHOẢN"}
        </h1>
        <p className="text-muted-foreground">
          Tổng cộng: <strong className="text-foreground">{totalItems}</strong> sản phẩm
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="ml-3 text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <FilterX className="size-3" />
              Xoá bộ lọc
            </button>
          )}
        </p>
      </div>

      {/* Filters - Desktop */}
      <div className="hidden lg:block bg-white p-6 rounded-lg shadow-sm border mb-8">
        <div className="flex items-end gap-4">
          <FilterPanel />
          {/* Search - Desktop */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">Tìm kiếm</label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                placeholder="Tên tài khoản, mã code..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
          {/* Reset Button - Desktop */}
          <div>
            <label className="block text-sm font-medium mb-2">&nbsp;</label>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              size="icon"
            >
              <FilterX className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters - Mobile */}
      <div className="lg:hidden mb-4 flex items-center gap-2">
        <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="size-4" />
              Bộ lọc
              {hasActiveFilters && (
                <Badge className="ml-1 bg-blue-600">{totalItems}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Bộ lọc</SheetTitle>
              <SheetDescription>Tìm kiếm tài khoản phù hợp</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-5">
              {/* Rank */}
              {filterOptions?.ranks && filterOptions.ranks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Rank</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={!rankFilter ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => updateFilter("rank", null)}
                    >
                      Tất cả
                    </Badge>
                    {filterOptions.ranks.map((r) => (
                      <Badge
                        key={r}
                        variant={rankFilter === r ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => updateFilter("rank", r)}
                      >
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-2">Tìm kiếm</label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateFilter("q", localSearch.trim() || null);
                    setMobileFilterOpen(false);
                  }}
                >
                  <Input
                    placeholder="Tên, mã code..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                  />
                </form>
              </div>

              <Separator />

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium mb-2">Sắp xếp</label>
                <Select
                  value={sortBy}
                  onValueChange={(v) => updateFilter("sortBy", v === "newest" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="price_asc">Giá: Thấp → Cao</SelectItem>
                    <SelectItem value="price_desc">Giá: Cao → Thấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                variant="destructive"
                onClick={() => { handleReset(); setMobileFilterOpen(false); }}
              >
                <FilterX className="size-4 mr-2" />
                Xoá tất cả bộ lọc
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <Input
            type="text"
            placeholder="Tìm kiếm..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" className="bg-blue-600" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {accounts.map((acc) => (
          <Card
            key={acc.id}
            className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-400 overflow-hidden"
          >
            <div className="relative aspect-video overflow-hidden bg-gray-100">
              {acc.images?.[0] ? (
                <img
                  src={acc.images[0]}
                  alt={acc.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-6xl">
                  🎮
                </div>
              )}
              {acc.attributes?.discount && (
                <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                  -{acc.attributes.discount}%
                </Badge>
              )}
              {/* Rating badge */}
              {acc.rating && acc.rating.count > 0 && (
                <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1">
                  <Star className="size-3 fill-white" />
                  {acc.rating.avg}
                </Badge>
              )}
            </div>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-sm line-clamp-2 min-h-[40px] text-gray-800">
                {acc.title}
              </h3>

              {acc.attributes?.code && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded w-fit">
                  <Tag className="size-3" />
                  <span className="font-mono">{acc.attributes.code}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {acc.type && (
                  <Badge
                    variant={"secondary"}
                    className="text-xs"
                  >
                    {acc.type.toUpperCase()}
                  </Badge>
                )}
                {!acc.isSold && (
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    Còn hàng
                  </Badge>
                )}
                {acc.rating && acc.rating.count > 0 && (
                  <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
                    {acc.rating.avg}★ ({acc.rating.count})
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                {acc.attributes?.originalPrice && (
                  <p className="text-sm text-muted-foreground line-through">
                    {acc.attributes.originalPrice.toLocaleString("vi-VN")} đ
                  </p>
                )}
                <p className="text-xl font-bold text-red-600">
                  {acc.price.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() =>
                    navigate(`/tai-khoan/${categorySlug || acc.game}/${acc.id}`)
                  }
                >
                  Mua ngay
                </Button>

                <button
                  onClick={() => {
                    const isIn = compareStore.has(acc.id);
                    if (isIn) {
                      compareStore.remove(acc.id);
                    } else {
                      if (compareStore.ids.length >= 5) {
                        toast.error("Chỉ được so sánh tối đa 5 sản phẩm");
                        return;
                      }
                      compareStore.add(acc.id);
                      toast.success("Đã thêm vào danh sách so sánh");
                    }
                  }}
                  className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                    compareStore.has(acc.id)
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50"
                  }`}
                  title={
                    compareStore.has(acc.id)
                      ? "Bỏ khỏi so sánh"
                      : "Thêm vào so sánh"
                  }
                >
                  <GitCompareArrows
                    className={`size-4 transition-transform duration-200 ${
                      compareStore.has(acc.id) ? "scale-110" : ""
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-10">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) handlePageChange(page - 1);
                }}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
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
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (pageNum === page - 2 || pageNum === page + 2) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationEllipsis />
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
                className={
                  page === totalPages ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default ShopPage;
