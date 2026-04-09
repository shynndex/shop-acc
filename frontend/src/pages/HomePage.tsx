import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Bell,
  User,
  Menu,
  Eye,
  Star,
  Trophy,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

// Dữ liệu mẫu
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

const gameCategories = [
  {
    id: 1,
    name: "THU ACC THANH LÝ ALL...",
    icon: "💰",
    color: "bg-yellow-100",
  },
  { id: 2, name: "ACC LIÊN QUÂN SALE", icon: "⚔️", color: "bg-red-100" },
  { id: 3, name: "ACC BLOX FRUITS GIÁ RẺ", icon: "🍇", color: "bg-purple-100" },
  { id: 4, name: "ACC FREE FIRE GIÁ RẺ", icon: "🔥", color: "bg-orange-100" },
  { id: 5, name: "ACC TFT ĐDTL GIÁ RẺ", icon: "⚡", color: "bg-blue-100" },
  { id: 6, name: "ACC GROW A GARDEN", icon: "🌱", color: "bg-green-100" },
];

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo và Menu */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-orange-500 to-cyan-500 bg-clip-text text-transparent">
              ShopSam
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2">
              <Menu className="h-4 w-4" />
              Danh mục
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              Đã xem
            </Button>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Input
              type="search"
              placeholder="Tìm kiếm"
              className="w-full bg-muted/50 pr-10"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1 h-8 w-8"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700">Nạp Tiền</Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              3
            </span>
          </Button>
          <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarImage src="/avatar.png" alt="User" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

const TopUpSidebar = () => {
  return (
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
};

const MainBanner = () => {
  return (
    <Card className="relative overflow-hidden h-[300px] md:h-[400px]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-300 rounded-full blur-3xl" />
        </div>

        {/* Content */}
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

        {/* Character Images (Placeholder) */}
        <div className="absolute left-0 bottom-0 w-1/3 h-full opacity-80">
          <div className="w-full h-full bg-gradient-to-r from-purple-600/30 to-transparent" />
        </div>
        <div className="absolute right-0 bottom-0 w-1/3 h-full opacity-80">
          <div className="w-full h-full bg-gradient-to-l from-blue-600/30 to-transparent" />
        </div>
      </div>

      {/* Navigation Arrows */}
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
};

const GameCategories = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {gameCategories.map((game) => (
        <Card
          key={game.id}
          className="cursor-pointer hover:shadow-lg transition-shadow group"
        >
          <CardContent className="p-4 text-center">
            <div
              className={`${game.color} w-16 h-16 mx-auto mb-3 rounded-lg flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}
            >
              {game.icon}
            </div>
            <h3 className="font-semibold text-sm line-clamp-2">{game.name}</h3>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const AccountSection = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-2xl">
            🐉
          </div>
          <h2 className="text-2xl font-bold">KHO NICK LIÊN QUÂN</h2>
        </div>
        <Button variant="ghost" className="gap-1 text-muted-foreground">
          Xem tất cả
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <Card
            key={item}
            className="overflow-hidden cursor-pointer hover:shadow-xl transition-all group"
          >
            <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-600 relative">
              <div className="absolute top-2 left-2">
                <Badge className="bg-red-500 text-white">SALE</Badge>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
            <CardContent className="p-3">
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                Acc Liên Quân Full Skin VIP {item}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-red-600 font-bold">{item * 500.0}đ</span>
                <span className="text-xs text-muted-foreground line-through">
                  {item * 750.0}đ
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <TopUpSidebar />

            {/* Dragon Event */}
            <Card className="mt-4 bg-gradient-to-br from-yellow-400 to-orange-500 border-0">
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
            <AccountSection />
          </div>
        </div>
      </main>

      {/* Floating Chat Button */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}
