import type { GameCategory } from "@/types";

export const GAME_CATEGORIES: GameCategory[] = [
  {
    gameSlug: "lien-quan",
    gameName: "LIÊN QUÂN MOBILE",
    gameIcon: "🎮",
    categories: [
      {
        id: "lq-trang",
        name: "Nick Thông Tin Đẹp",
        slug: "nick-thong-tin-dep",
        image: "../../public/nakvt.gif",
        priceFrom: 100000,
        stock: 8,
      },
      {
        id: "lq-reg",
        name: "Nick Reg Trắng",
        slug: "nick-reg-trang",
        image: "/img/lq-reg.jpg",
        priceFrom: 30000,
        stock: 110,
      },
      {
        id: "lq-rlp",
        name: "Nick RLP",
        slug: "nick-rlp",
        image: "/img/lq-rlp.jpg",
        priceFrom: 270000,
        stock: 6,
      },
    ],
  },
  {
    gameSlug: "valorant",
    gameName: "VALORANT",
    gameIcon: "🔫",
    categories: [
      {
        id: "val-rank",
        name: "Acc Rank Cứng",
        slug: "acc-rank-cung",
        image: "/img/val-rank.jpg",
        priceFrom: 150000,
        stock: 15,
      },
      {
        id: "val-skin",
        name: "Acc Full Skin",
        slug: "acc-full-skin",
        image: "/img/val-skin.jpg",
        priceFrom: 500000,
        stock: 4,
      },
    ],
  },
  {
    gameSlug: "free-fire",
    gameName: "FREE FIRE",
    gameIcon: "🔥",
    categories: [
      {
        id: "ff-vip",
        name: "Acc VIP Bundle",
        slug: "acc-vip-bundle",
        image: "/img/ff-vip.jpg",
        priceFrom: 200000,
        stock: 22,
      },
    ],
  },
];
