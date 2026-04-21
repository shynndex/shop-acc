import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Star,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { AccountCategories } from "@/components/client/sections/AccountCategories";

// Dữ liệu mẫu (nên move ra file constants/data sau này)
const topUpData = [
  { id: 1, username: "****ep", amount: "7.000.000đ", rank: 1, isGold: true },
  { id: 2, username: "****59075078...", amount: "4.400.000đ", rank: 2, isGold: true },
  { id: 3, username: "****49783686...", amount: "2.700.000đ", rank: 3, isGold: true },
  { id: 4, username: "****404", amount: "2.250.000đ", rank: 4, isGold: false },
  { id: 5, username: "****61890934...", amount: "2.240.000đ", rank: 5, isGold: false },
];

const gameCategories = [
  { id: 1, name: "THU ACC THANH LÝ ALL...", icon: "💰", color: "bg-yellow-100" },
  { id: 2, name: "ACC LIÊN QUÂN SALE", icon: "⚔️", color: "bg-red-100" },
  { id: 3, name: "ACC BLOX FRUITS GIÁ RẺ", icon: "🍇", color: "bg-purple-100" },
  { id: 4, name: "ACC FREE FIRE GIÁ RẺ", icon: "🔥", color: "bg-orange-100" },
  { id: 5, name: "ACC TFT ĐDTL GIÁ RẺ", icon: "⚡", color: "bg-blue-100" },
  { id: 6, name: "ACC GROW A GARDEN", icon: "🌱", color: "bg-green-100" },
];

//  Sidebar: Top nạp thẻ
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
            <span className="font-semibold text-sm text-blue-600">{item.amount}</span>
          </div>
        ))}
      </div>
      <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">Nạp thẻ ngay</Button>
    </CardContent>
  </Card>
);

// 🔹 Banner chính
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
    {/* Navigation Arrows */}
    <Button size="icon" variant="ghost" className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white">
      <ChevronRight className="h-6 w-6 rotate-180" />
    </Button>
    <Button size="icon" variant="ghost" className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white">
      <ChevronRight className="h-6 w-6" />
    </Button>
  </Card>
);

// 🔹 Danh mục game
const GameCategories = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {gameCategories.map((game) => (
      <Card key={game.id} className="cursor-pointer hover:shadow-lg transition-shadow group">
        <CardContent className="p-4 text-center">
          <div className={`${game.color} w-16 h-16 mx-auto mb-3 rounded-lg flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
            {game.icon}
          </div>
          <h3 className="font-semibold text-sm line-clamp-2">{game.name}</h3>
        </CardContent>
      </Card>
    ))}
  </div>
);



export default function HomePage() {
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

      {/* Floating Chat Button - giữ nguyên vì là feature global */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-40"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}