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
import { GAME_CATEGORIES } from "@/config/categories";
import { accountService } from "@/services/client/accountService";
import type { Account } from "@/types";
import { PackageX, Search, Tag } from "lucide-react";
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
  const [localSearch, setLocalSearch] = useState(searchParams.get("q") || "");

  const categoryInfo = useMemo(() => {
    if (!categorySlug) return null;
    for (const game of GAME_CATEGORIES) {
      const found = game.categories.find((c) => c.slug === categorySlug);
      if (found) {
        return { ...found, gameName: game.gameName, gameSlug: game.gameSlug };
      }
    }
    return null;
  }, [categorySlug]);

  // Fetch data khi params thay đổi
  useEffect(() => {
    const fetchAccount = async () => {
      try {
        setLoading(true);
        setHasError(false);

        const res = await accountService.getAll({
          page,
          limit: 12,
          type: categorySlug || undefined,
          minPrice: minPrice ? parseInt(minPrice) : undefined,
          maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        });

        setAccounts(res.accounts || []);
        setTotalItems(res.totalItems || 0);
        setTotalPages(res.totalPages || 1);
      } catch (error) {
        console.error("❌ Error fetching accounts:", error);
        setHasError(true);
        setAccounts([]);
        toast.error("Không thể tải danh sách tài khoản. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [categorySlug, page, minPrice, maxPrice]);

  const handleFilterChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newParams.delete("minPrice");
      newParams.delete("maxPrice");
    } else {
      const [min, max] = value.split("-");
      newParams.set("minPrice", min);
      newParams.set("maxPrice", max);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (localSearch.trim()) {
      newParams.set("q", localSearch.trim());
    } else {
      newParams.delete("q");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    const newParams = new URLSearchParams();
    setSearchParams(newParams);
    setLocalSearch("");
  };

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
          Tổng cộng:<strong className="text-foreground">{totalItems}</strong>{" "}
          sản phẩm
        </p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Price Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Chọn mức giá:
            </label>
            <Select
              value={
                minPrice || maxPrice
                  ? `${minPrice || 0} - ${maxPrice || 9999999}`
                  : "all"
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="0-50000">Dưới 50.000đ</SelectItem>
                <SelectItem value="50000-100000">50.000đ - 100.000đ</SelectItem>
                <SelectItem value="100000-300000">
                  100.000đ - 300.000đ
                </SelectItem>
                <SelectItem value="300000-500000">
                  300.000đ - 500.000đ
                </SelectItem>
                <SelectItem value="500000-9999999">Trên 500.000đ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Search Box */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Tìm kiếm</label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                placeholder="Tìm kiếm mã sản phẩm, tên tài khoản..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="flex-1"
              />
              <Button
                className={"bg-blue-600 hover:bg-blue-700"}
                variant={"default"}
                type="submit"
              >
                <Search className="h-4 w-4 mr-2" />
                Tìm kiếm
              </Button>
            </form>
          </div>
          {/* Reset Button */}
          <div className="flex items-center justify-center">
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
            >
              Đặt lại bộ lọc
            </Button>
          </div>
        </div>
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
                    className="text-xs bg-blue text-blue-700"
                  >
                    {acc.type.toUpperCase()}
                  </Badge>
                )}
                {acc.status === "available" && (
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    Còn hàng
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

              <div className="flex pt-2">
                <Button
                  className={"flex-1 bg-blue-600 hover:bl-blue-700"}
                  onClick={() =>
                    navigate(`/tai-khoan/${categorySlug}/${acc.id}`)
                  }
                >
                  Mua ngay
                </Button>
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
