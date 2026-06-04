import { api } from "@/lib/clientAxios";
import type {
  PublicCategoriesResponse,
  PublicPopupsResponse,
  PublicBannersResponse,
  PublicCmsPageResponse,
} from "@/types/admin/ui.type";

export const uiService = {
  /**
   * GET /api/ui/categories
   * Lấy danh mục game active (thay thế GAME_CATEGORIES hardcoded)
   */
  getCategories: async () => {
    return await api.get<PublicCategoriesResponse>("/ui/categories");
  },

  /**
   * GET /api/ui/popups?page=<page>
   * Lấy popup active theo trang
   */
  getPopups: async (page: string) => {
    return await api.get<PublicPopupsResponse>("/ui/popups", {
      params: { page },
    });
  },

  /**
   * GET /api/ui/banners
   * Lấy banner active
   */
  getBanners: async () => {
    return await api.get<PublicBannersResponse>("/ui/banners");
  },

  /**
   * GET /api/ui/pages/:slug
   * Lấy CMS page theo slug
   */
  getCmsPage: async (slug: string) => {
    return await api.get<PublicCmsPageResponse>(`/ui/pages/${slug}`);
  },

  /**
   * GET /api/ui/scrolling-text
   * Lấy text chạy ngang (marquee) — admin configurable
   */
  getScrollingText: async () => {
    return await api.get<{
      success: boolean;
      data: { text: string; isActive: boolean };
    }>("/ui/scrolling-text");
  },
};
