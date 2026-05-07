export type GameType =
  | "lien-quan"
  | "lien-minh"
  | "valorant"
  | "free-fire"
  | "khac";
export type AccountType = "standard" | "vip" | "reg" | "random" | "trang"; // có nên hardcode cứng không ?

export interface AccountLoginInfo {
  username: string;
  password: string;
}

export interface Account {
  _id: string;
  title: string;
  game: GameType;
  price: number;
  description: string;
  attributes: Record<string, any>;
  images: string[];
  type: AccountType;
  loginInfo: AccountLoginInfo;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountListResponse {
  success: boolean;
  data: {
    accounts: Account[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

export interface CreateAccountPayload {
  title: string;
  game: GameType;
  price: number;
  description?: string;
  attributes: Record<string, any>;
  images?: string[];
  type: AccountType;
  loginInfo: AccountLoginInfo;
}

export interface UpdateAccountPayload {
  title?: string;
  game?: GameType;
  price?: number;
  description?: string;
  attributes?: Record<string, any>;
  images?: string[];
  type?: AccountType;
  loginInfo?: AccountLoginInfo;
  isActive?: boolean;
}
