export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  balance?: number;
  role?: "user" | "admin" | "super_admin";
  createdAt?: string;
  updatedAt?: string;
}

export interface Account {
  id: string;
  title: string;
  game: string;
  type?: string; // Ví dụ: "trang", "reg", "rlp", "random"
  price: number;
  description: string;
  attributes: Record<string, any>; // Rank, Skin, Tướng...
  images: string[];
  status: "available" | "sold" | "reserved";
  isActive?: boolean;
  isSold?: boolean;
  rating?: {
    avg: number;
    count: number;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string; // Dùng cho URL: /tai-khoan/:slug
  typeValue: string; // Giá trị gửi lên backend cho field "type": "trang", "reg", "rlp"...
  image: string;
  priceFrom: number;
  stock: number;
}

export interface GameCategory {
  gameSlug: string; // "lien-quan", "valorant", "free-fire"
  gameName: string;
  gameIcon: string; // Emoji hoặc URL icon
  categories: CategoryItem[];
}

export interface Order {
  orderId: string;
  accountId: string;
  accountTitle: string;
  credentials: Record<string, string>;
  price: number;
  purchasedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string | number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export interface Review {
  _id: string;
  user: {
    _id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  account: string | { _id: string; title: string; game: string; price: number };
  order: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  moderatedBy?: string | null;
  moderatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AdminRole = "super_admin" | "admin";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
}
