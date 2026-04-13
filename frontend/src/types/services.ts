import type { Account } from ".";

export interface SignInPayload {
  username: string;
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
  message: string;
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
  sortBy?: "price_asc" | "price_desc" | "newest";
}
