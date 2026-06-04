// ─── Game Category ─────────────────────────────────────────────────────────

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  typeValue: string;
  image: string;
  priceFrom: number;
  stock: number;
  isActive: boolean;
  sortOrder: number;
}

export interface GameCategory {
  _id: string;
  gameSlug: string;
  gameName: string;
  gameIcon: string;
  iconType: "emoji" | "image";
  isActive: boolean;
  sortOrder: number;
  categories: CategoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGameCategoryPayload {
  gameSlug: string;
  gameName: string;
  gameIcon?: string;
  iconType?: "emoji" | "image";
  isActive?: boolean;
  sortOrder?: number;
  categories?: Omit<CategoryItem, "_id">[];
}

export interface UpdateGameCategoryPayload {
  gameName?: string;
  gameIcon?: string;
  iconType?: "emoji" | "image";
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateCategoryItemPayload {
  id: string;
  name: string;
  slug: string;
  typeValue: string;
  image?: string;
  priceFrom?: number;
  stock?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryItemPayload {
  name?: string;
  slug?: string;
  typeValue?: string;
  image?: string;
  priceFrom?: number;
  stock?: number;
  isActive?: boolean;
  sortOrder?: number;
}

// ─── Popup ─────────────────────────────────────────────────────────────────

export type PopupType = "notification" | "promotion";
export type PopupTrigger = "timeout" | "click";
export type DisplayPage =
  | "home"
  | "shop"
  | "compare"
  | "account-detail"
  | "order-history"
  | "profile"
  | "all";

export interface Popup {
  _id: string;
  title: string;
  type: PopupType;
  content: string;
  imageUrl: string;
  imageMobileUrl: string;
  ctaText: string;
  ctaLink: string;
  displayPages: DisplayPage[];
  triggerType: PopupTrigger;
  triggerDelay: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePopupPayload {
  title: string;
  type: PopupType;
  content?: string;
  imageUrl?: string;
  imageMobileUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  displayPages: DisplayPage[];
  triggerType?: PopupTrigger;
  triggerDelay?: number;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePopupPayload extends Partial<CreatePopupPayload> {}

// ─── Banner ────────────────────────────────────────────────────────────────

export interface Banner {
  _id: string;
  title: string;
  imageDesktopUrl: string;
  imageMobileUrl: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerPayload {
  title: string;
  imageDesktopUrl: string;
  imageMobileUrl?: string;
  headline?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateBannerPayload extends Partial<CreateBannerPayload> {}

// ─── CMS Page ──────────────────────────────────────────────────────────────

export interface CmsPage {
  _id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCmsPagePayload {
  title?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
}

// ─── API Response types ────────────────────────────────────────────────────

export interface GameCategoryListResponse {
  success: boolean;
  data: {
    games: GameCategory[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

export interface PopupListResponse {
  success: boolean;
  data: {
    popups: Popup[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

export interface BannerListResponse {
  success: boolean;
  data: {
    banners: Banner[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

export interface CmsPageListResponse {
  success: boolean;
  data: {
    pages: CmsPage[];
  };
}

// ─── Public API response types ─────────────────────────────────────────────

export interface PublicCategoriesResponse {
  success: boolean;
  data: {
    games: GameCategory[];
  };
}

export interface PublicPopupsResponse {
  success: boolean;
  data: {
    popups: Popup[];
  };
}

export interface PublicBannersResponse {
  success: boolean;
  data: {
    banners: Banner[];
  };
}

export interface PublicCmsPageResponse {
  success: boolean;
  data: CmsPage;
}
