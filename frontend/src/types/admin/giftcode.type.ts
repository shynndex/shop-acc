export interface Giftcode {
  _id: string;
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  gameFilter: string | null;
  expiresAt: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdBy: {
    _id: string;
    username: string;
    email: string;
  };
  isValid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GiftcodeListResponse {
  success: boolean;
  data: {
    giftcodes: Giftcode[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

export interface CreateGiftcodePayload {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  gameFilter?: string;
  expiresAt?: string;
}

export interface UpdateGiftcodePayload {
  type?: "percent" | "fixed";
  value?: number;
  minOrderAmount?: number;
  maxUses?: number;
  gameFilter?: string;
  expiresAt?: string;
  isActive?: boolean;
}
