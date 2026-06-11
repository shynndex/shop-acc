import { api } from "@/lib/adminAxios";

export interface SiteConfigData {
  shopName: string;
  logo: string;
  favicon: string;
  description: string;
  seoKeywords: string;
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
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    ogImage: string;
    googleAnalyticsId: string;
    facebookPixelId: string;
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
  footerContent: string;
  privacyPolicy: string;
  termsOfService: string;
  depositGuide: string;
  purchaseGuide: string;
}

export const siteConfigService = {
  /** GET /api/admin/site-config — admin only */
  getConfig: async (): Promise<{ success: boolean; data: SiteConfigData }> => {
    return await api.get("/site-config");
  },

  /** PUT /api/admin/site-config — admin only */
  updateConfig: async (
    payload: Partial<SiteConfigData>
  ): Promise<{ success: boolean; message: string; data: SiteConfigData }> => {
    return await api.put("/site-config", payload);
  },
};
