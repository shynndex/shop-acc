import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { GAME_CATEGORIES } from "@/config/categories";
import type { CategoryItem, GameCategory } from "@/types";
import viewAllGif from "@/assets/view-all.gif";

//  Card con tái sử dụng
const CategoryCard = ({
  cat,
}: {
  cat: CategoryItem;
}) => {
  const navigate = useNavigate();

  return (
    <Card
      className="overflow-hidden group cursor-pointer border-2 border-transparent  hover:shadow-xl transition-all"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/tai-khoan/${cat.slug}`);
      }}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={cat.image}
          alt={cat.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Fallback nếu ảnh lỗi
            e.currentTarget.src = `https://placehold.co/400x250/1e293b/ffffff?text=${cat.name}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <CardContent className="p-4 text-center space-y-3 bg-white">
        <h3 className="font-bold text-sm text-gray-800 line-clamp-2 min-h-[40px]">
          {cat.name}
        </h3>

        <Badge className="bg-gradient-to-br from-amber-500 to-orange-600 hover:bg-orange-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
          💎 Chỉ từ: <strong>{cat.priceFrom.toLocaleString("vi-VN")}đ</strong>
        </Badge>

        <p className="text-sm font-medium text-gray-600">
          Còn{" "}
          <span className="text-red-600 font-bold text-lg">{cat.stock}</span>{" "}
          Nick
        </p>

        <div className="flex justify-center mt-5">
          <img src={viewAllGif} alt="Xem tất cả" className=" cursor-pointer" />
        </div>
      </CardContent>
    </Card>
  );
};

//  Section theo từng Game
const GameSection = ({ game }: { game: GameCategory }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 bg-gray-50/50 p-6 rounded-xl">
      <div className="flex items-center gap-3 border-b-2 border-orange-400 pb-3">
        <span className="text-3xl">{game.gameIcon}</span>
        <h2 className="text-2xl font-bold uppercase tracking-wide text-gray-800">
          {game.gameName}
        </h2>
        <Badge variant="outline" className="ml-auto text-xs">
          {game.categories.length} loại
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {game.categories.map((cat) => (
          <CategoryCard key={cat.id} cat={cat} />
        ))}
      </div>

      <div className="text-center pt-2">
        <Button
          variant="outline"
          className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold px-8"
          onClick={() => navigate(`/tai-khoan/${game.gameSlug}`)}
        >
          Xem tất cả {game.gameName} →
        </Button>
      </div>
    </div>
  );
};

//  Component chính: Render tất cả game
export const AccountCategories = () => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-800 uppercase">
          🎮 DANH MỤC TÀI KHOẢN GAME
        </h1>
        <p className="text-muted-foreground">
          Chọn game bạn yêu thích và khám phá kho tài khoản đa dạng
        </p>
      </div>
      {GAME_CATEGORIES.map((game) => (
        <GameSection key={game.gameSlug} game={game} />
      ))}
    </div>
  );
};
