import { api } from "@/lib/clientAxios";
import type {
  PublicCategoriesResponse,
  PublicPopupsResponse,
  PublicBannersResponse,
  PublicCmsPageResponse,
} from "@/types/admin/ui.type";

// ─── Public site config response (unwrapped by axios interceptor) ─────
export interface PublicSiteConfigData {
  shopName: string;
  logo: string;
  description: string;
  contact: {
    phone: string;
    email: string;
    address: string;
    facebook: string;
    zalo: string;
    telegram: string;
    messenger: string;
    discord: string;
  };
  support: {
    chatEnabled: boolean;
    messengerEnabled: boolean;
    zaloEnabled: boolean;
    telegramEnabled: boolean;
    discordEnabled: boolean;
    marqueeEnabled: boolean;
    marqueeSpeed: "slow" | "normal" | "fast";
  };
  theme: {
    primary: string;
    button: string;
    heading: string;
    background: string;
    footer: string;
    footerText: string;
  };
  topNotification: string;
}

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

  /**
   * GET /api/ui/site-config
   * Lấy cấu hình public của website (tên shop, contact, support, theme)
   */
  getSiteConfig: async () => {
    return await api.get<PublicSiteConfigData>("/ui/site-config");
  },

  /**
   * GET /api/ui/contact-info
   * Lấy thông tin liên hệ (phone, email, social links)
   */
  getContactInfo: async () => {
    return await api.get<{
      success: boolean;
      data: {
        phone: string;
        email: string;
        address: string;
        facebook: string;
        zalo: string;
        telegram: string;
        messenger: string;
        discord: string;
      };
    }>("/ui/contact-info");
  },
};
