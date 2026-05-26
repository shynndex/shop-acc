import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { accountService } from "@/services/client/accountService";
import type { Account } from "@/types";
import {
  BadgePercent,
  Flame,
  Trophy,
  Star,
  Tag,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GAME_CATEGORIES } from "@/config/categories";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AccountCategories } from "@/components/client/sections/AccountCategories";

// Dữ liệu mẫu (nên move ra file constants/data sau này)
const topUpData = [
  { id: 1, username: "****ep", amount: "7.000.000đ", rank: 1, isGold: true },
  {
    id: 2,
    username: "****59075078...",
    amount: "4.400.000đ",
    rank: 2,
    isGold: true,
  },
  {
    id: 3,
    username: "****49783686...",
    amount: "2.700.000đ",
    rank: 3,
    isGold: true,
  },
  { id: 4, username: "****404", amount: "2.250.000đ", rank: 4, isGold: false },
  {
    id: 5,
    username: "****61890934...",
    amount: "2.240.000đ",
    rank: 5,
    isGold: false,
  },
];


// Sidebar: Top nạp thẻ
const TopUpSidebar = () => (
  <Card className="w-full max-w-sm">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-4 font-semibold">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <span>TOP NẠP THẺ THÁNG 4</span>
      </div>
      <div className="space-y-3">
        {topUpData.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {item.isGold ? (
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-blue-500 flex items-center justify-center text-xs font-medium text-blue-500">
                  {item.rank}
                </div>
              )}
              <span className="font-medium text-sm">{item.username}</span>
            </div>
            <span className="font-semibold text-sm text-blue-600">
              {item.amount}
            </span>
          </div>
        ))}
      </div>
      <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
        Nạp thẻ ngay
      </Button>
    </CardContent>
  </Card>
);

// Banner chính
const MainBanner = () => (
  <Card className="relative overflow-hidden h-[300px] md:h-[400px]">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-300 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white p-8">
        <h1 className="text-5xl md:text-7xl font-black mb-4 text-center drop-shadow-lg">
          <span className="bg-gradient-to-r from-cyan-300 via-white to-orange-400 bg-clip-text text-transparent">
            SHOPT1
          </span>
          <span className="text-orange-500">.</span>
          <span className="bg-gradient-to-r from-cyan-300 via-white to-cyan-300 bg-clip-text text-transparent">
            COM
          </span>
        </h1>
        <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-lg backdrop-blur">
          <span className="text-xl">🎵</span>
          <span className="font-semibold">MẠNH LÀM SỚP ẠC</span>
        </div>
      </div>
    </div>
    <Button
      size="icon"
      variant="ghost"
      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
    >
      <ChevronRight className="h-6 w-6 rotate-180" />
    </Button>
    <Button
      size="icon"
      variant="ghost"
      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
    >
      <ChevronRight className="h-6 w-6" />
    </Button>
  </Card>
);

// Danh mục game — style AccountCategories
const GameCategories = () => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {GAME_CATEGORIES.map((game) => (
        <Card
          key={game.gameSlug}
          className="overflow-hidden group cursor-pointer border-2 border-transparent hover:shadow-xl transition-all duration-300"
          onClick={() => navigate(`/tai-khoan/${game.gameSlug}`)}
        >
          <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-5xl group-hover:scale-110 transition-transform duration-500">
              {game.gameIcon}
            </span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
          <CardContent className="p-4 text-center space-y-3 bg-white">
            <h3 className="font-bold text-sm text-gray-800 line-clamp-2 min-h-[40px]">
              {game.gameName}
            </h3>
            <Badge className="bg-gradient-to-br from-amber-500 to-orange-600 hover:bg-orange-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
              {game.gameIcon} {game.categories.length} loại
            </Badge>
            <p className="text-sm font-medium text-gray-600 flex items-center justify-center gap-1">
              <BadgePercent className="size-4 text-blue-500" />
              Từ{" "}
              <span className="text-red-600 font-bold text-lg">
                {Math.min(...game.categories.map((c) => c.priceFrom)).toLocaleString("vi-VN")}đ
              </span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default function HomePage() {
  const navigate = useNavigate();
  const [popularAccounts, setPopularAccounts] = useState<Account[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);

  useEffect(() => {
    // Fetch popular products
    accountService
      .getSuggestions({ type: "popular", limit: 6 })
      .then((data) => setPopularAccounts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setPopularLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <div className="lg:w-80 flex-shrink-0 space-y-4">
          <TopUpSidebar />
          <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 border-0">
            <CardContent className="p-4 text-center text-white">
              <div className="text-4xl mb-2">🐉</div>
              <h3 className="font-bold mb-1">NHẬN QUA DRAGON</h3>
              <p className="text-sm opacity-90">Sự kiện đặc biệt</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <MainBanner />
          <GameCategories />
          <AccountCategories />
        </div>
      </div>

      {/* Popular Products Section */}
      {!popularLoading && popularAccounts.length > 0 && (
        <section className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Flame className="size-6 text-orange-500" />
                Sản phẩm bán chạy
              </h2>
              <p className="text-sm text-muted-foreground">
                Những tài khoản được giao dịch nhiều nhất
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-blue-600"
              onClick={() => navigate("/tai-khoan/lien-quan")}
            >
              Xem tất cả <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularAccounts.map((acc) => (
              <Card
                key={acc.id}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-400 overflow-hidden"
                onClick={() => navigate(`/tai-khoan/${acc.game}/${acc.id}`)}
              >
                <div className="aspect-video bg-gray-100 overflow-hidden relative">
                  {acc.attributes?.discount && (
                    <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 z-10">
                      -{acc.attributes.discount}%
                    </Badge>
                  )}
                  {acc.rating && acc.rating.count > 0 && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1 z-10">
                      <Star className="size-3 fill-white" />
                      {acc.rating.avg}
                    </Badge>
                  )}
                  {acc.images?.[0] ? (
                    <img
                      src={acc.images[0]}
                      alt={acc.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-3xl">🎮</div>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-semibold line-clamp-1">{acc.title}</p>
                  {acc.attributes?.code && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded w-fit mt-1">
                      <Tag className="size-3" />
                      <span className="font-mono">{acc.attributes.code}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      {acc.attributes?.originalPrice && (
                        <p className="text-xs text-muted-foreground line-through">
                          {acc.attributes.originalPrice.toLocaleString("vi-VN")}đ
                        </p>
                      )}
                      <p className="text-sm font-bold text-red-600">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Floating Chat Button */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-40"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}
