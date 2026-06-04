import { api } from "@/lib/adminAxios";
import type {
  GameCategory,
  GameCategoryListResponse,
  CreateGameCategoryPayload,
  UpdateGameCategoryPayload,
  CreateCategoryItemPayload,
  UpdateCategoryItemPayload,
  Popup,
  PopupListResponse,
  CreatePopupPayload,
  UpdatePopupPayload,
  Banner,
  BannerListResponse,
  CreateBannerPayload,
  UpdateBannerPayload,
  CmsPage,
  CmsPageListResponse,
  UpdateCmsPagePayload,
} from "@/types/admin/ui.type";

export const uiService = {
  // ─── Game Categories ──────────────────────────────────────────────────
  listGames: async (params?: Record<string, any>) => {
    return await api.get<GameCategoryListResponse>("/ui/categories/games", { params });
  },

  getGame: async (id: string) => {
    return await api.get<{ success: boolean; data: GameCategory }>(`/ui/categories/games/${id}`);
  },

  createGame: async (payload: CreateGameCategoryPayload) => {
    return await api.post<{ success: boolean; data: GameCategory }>("/ui/categories/games", payload);
  },

  updateGame: async (id: string, payload: UpdateGameCategoryPayload) => {
    return await api.put<{ success: boolean; data: GameCategory }>(`/ui/categories/games/${id}`, payload);
  },

  deleteGame: async (id: string) => {
    return await api.delete<{ success: boolean; message: string }>(`/ui/categories/games/${id}`);
  },

  // ─── Category Items ───────────────────────────────────────────────────
  listCategoryItems: async (gameId: string) => {
    return await api.get<{ success: boolean; data: { categories: any[] } }>(
      `/ui/categories/games/${gameId}/items`,
    );
  },

  createCategoryItem: async (gameId: string, payload: CreateCategoryItemPayload) => {
    return await api.post<{ success: boolean; data: GameCategory }>(
      `/ui/categories/games/${gameId}/items`,
      payload,
    );
  },

  updateCategoryItem: async (gameId: string, itemId: string, payload: UpdateCategoryItemPayload) => {
    return await api.put<{ success: boolean; data: GameCategory }>(
      `/ui/categories/games/${gameId}/items/${itemId}`,
      payload,
    );
  },

  deleteCategoryItem: async (gameId: string, itemId: string) => {
    return await api.delete<{ success: boolean; message: string }>(
      `/ui/categories/games/${gameId}/items/${itemId}`,
    );
  },

  // ─── Reorder ─────────────────────────────────────────────────────────────
  reorderCategoryItems: async (gameId: string, items: { id: string; sortOrder: number }[]) => {
    return await api.patch(`/ui/categories/games/${gameId}/items/reorder`, { items });
  },

  reorderBanners: async (items: { _id: string; sortOrder: number }[]) => {
    return await api.patch("/ui/banners/reorder", { items });
  },

  reorderPopups: async (items: { _id: string; sortOrder: number }[]) => {
    return await api.patch("/ui/popups/reorder", { items });
  },

  // ─── Popups ────────────────────────────────────────────────────────────
  listPopups: async (params?: Record<string, any>) => {
    return await api.get<PopupListResponse>("/ui/popups", { params });
  },

  getPopup: async (id: string) => {
    return await api.get<{ success: boolean; data: Popup }>(`/ui/popups/${id}`);
  },

  createPopup: async (payload: CreatePopupPayload) => {
    return await api.post<{ success: boolean; data: Popup }>("/ui/popups", payload);
  },

  updatePopup: async (id: string, payload: UpdatePopupPayload) => {
    return await api.put<{ success: boolean; data: Popup }>(`/ui/popups/${id}`, payload);
  },

  deletePopup: async (id: string) => {
    return await api.delete<{ success: boolean; message: string }>(`/ui/popups/${id}`);
  },

  togglePopupActive: async (id: string) => {
    return await api.patch<{ success: boolean; data: Popup }>(`/ui/popups/${id}/toggle`);
  },

  // ─── Banners ───────────────────────────────────────────────────────────
  listBanners: async (params?: Record<string, any>) => {
    return await api.get<BannerListResponse>("/ui/banners", { params });
  },

  getBanner: async (id: string) => {
    return await api.get<{ success: boolean; data: Banner }>(`/ui/banners/${id}`);
  },

  createBanner: async (payload: CreateBannerPayload) => {
    return await api.post<{ success: boolean; data: Banner }>("/ui/banners", payload);
  },

  updateBanner: async (id: string, payload: UpdateBannerPayload) => {
    return await api.put<{ success: boolean; data: Banner }>(`/ui/banners/${id}`, payload);
  },

  deleteBanner: async (id: string) => {
    return await api.delete<{ success: boolean; message: string }>(`/ui/banners/${id}`);
  },

  // ─── CMS Pages ─────────────────────────────────────────────────────────
  listCmsPages: async () => {
    return await api.get<CmsPageListResponse>("/ui/pages");
  },

  getCmsPage: async (id: string) => {
    return await api.get<{ success: boolean; data: CmsPage }>(`/ui/pages/${id}`);
  },

  updateCmsPage: async (id: string, payload: UpdateCmsPagePayload) => {
    return await api.put<{ success: boolean; data: CmsPage }>(`/ui/pages/${id}`, payload);
  },
};
