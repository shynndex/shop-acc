import type { Account, User } from "@/types/index";

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    balance?: number;
    createdAt: string;
  };
  message?: string;
}

export interface AccountListResponse {
  accounts: Account[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

// Tham số query cho API
export interface GetAccountsParams {
  page?: number;
  limit?: number;
  game?: string; // Filter theo game: "lien-quan", "valorant"...
  type?: string; // Filter theo loại: "trang", "reg", "random"...
  minPrice?: number;
  maxPrice?: number;
  rank?: string; // Filter theo rank
  minSkins?: number; // Filter theo số skin tối thiểu
  minHeroes?: number; // Filter theo số tướng tối thiểu
  search?: string; // Tìm kiếm theo tên hoặc mã code
  sortBy?: "price_asc" | "price_desc" | "newest";
}

export interface FilterOptions {
  ranks: string[];
  skinRange: { min: number; max: number } | null;
  heroRange: { min: number; max: number } | null;
  priceRange: { min: number; max: number } | null;
}

//  Type cho checkAuth: có thể trả null nếu chưa login
export type CheckAuthResponse = User | null;
