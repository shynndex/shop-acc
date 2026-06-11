import mongoose from "mongoose";

const siteConfigSchema = new mongoose.Schema(
  {
    // ── Website Info ──────────────────────────────────────────────
    shopName: { type: String, default: "ShopSam" },
    logo: { type: String, default: "" },
    favicon: { type: String, default: "" },
    description: { type: String, default: "" },
    seoKeywords: { type: String, default: "" },

    // ── Contact Info ──────────────────────────────────────────────
    contact: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
      facebook: { type: String, default: "" },
      zalo: { type: String, default: "" },
      telegram: { type: String, default: "" },
      messenger: { type: String, default: "" },
      discord: { type: String, default: "" },
    },

    // ── Support Channels ──────────────────────────────────────────
    support: {
      chatEnabled: { type: Boolean, default: true },
      messengerEnabled: { type: Boolean, default: true },
      zaloEnabled: { type: Boolean, default: true },
      telegramEnabled: { type: Boolean, default: true },
      discordEnabled: { type: Boolean, default: false },
      marqueeEnabled: { type: Boolean, default: true },
      marqueeSpeed: {
        type: String,
        enum: ["slow", "normal", "fast"],
        default: "normal",
      },
    },

    // ── SEO ───────────────────────────────────────────────────────
    seo: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      metaKeywords: { type: String, default: "" },
      ogImage: { type: String, default: "" },
      googleAnalyticsId: { type: String, default: "" },
      facebookPixelId: { type: String, default: "" },
    },

    // ── Theme Colors ──────────────────────────────────────────────
    theme: {
      primary: { type: String, default: "#3b82f6" },
      button: { type: String, default: "#2563eb" },
      heading: { type: String, default: "#111827" },
      background: { type: String, default: "#ffffff" },
      footer: { type: String, default: "#1f2937" },
      footerText: { type: String, default: "#ffffff" },
    },

    // ── Content ───────────────────────────────────────────────────
    topNotification: { type: String, default: "" },
    footerContent: { type: String, default: "" },
    privacyPolicy: { type: String, default: "" },
    termsOfService: { type: String, default: "" },
    depositGuide: { type: String, default: "" },
    purchaseGuide: { type: String, default: "" },

    // ── Metadata ──────────────────────────────────────────────────
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one config document exists
siteConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

const SiteConfig = mongoose.model("SiteConfig", siteConfigSchema);

export default SiteConfig;
