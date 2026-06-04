import { z } from "zod";

// ─── GAME CATEGORY ─────────────────────────────────────────────────────────

export const createGameCategorySchema = z.object({
  gameSlug: z
    .string()
    .min(1, "Vui lòng nhập game slug")
    .max(50)
    .transform((v) => v.toLowerCase().trim()),
  gameName: z.string().min(1, "Vui lòng nhập tên game").max(100),
  gameIcon: z.string().max(50).optional().default("🎮"),
  iconType: z.enum(["emoji", "image"]).optional().default("emoji"),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
  categories: z
    .array(
      z.object({
        id: z.string().min(1, "Vui lòng nhập ID danh mục").max(50),
        name: z.string().min(1, "Vui lòng nhập tên danh mục").max(100),
        slug: z.string().min(1, "Vui lòng nhập slug").max(100),
        typeValue: z.string().min(1, "Vui lòng nhập type value").max(50),
        image: z.string().max(500).optional().default(""),
        priceFrom: z.number().min(0).optional().default(0),
        stock: z.number().int().min(0).optional().default(0),
        isActive: z.boolean().optional().default(true),
        sortOrder: z.number().int().min(0).optional().default(0),
      }),
    )
    .optional()
    .default([]),
});

export const updateGameCategorySchema = z.object({
  gameName: z.string().max(100).optional(),
  gameIcon: z.string().max(50).optional(),
  iconType: z.enum(["emoji", "image"]).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// ─── CATEGORY ITEM ─────────────────────────────────────────────────────────

export const createCategoryItemSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập ID danh mục").max(50),
  name: z.string().min(1, "Vui lòng nhập tên danh mục").max(100),
  slug: z.string().min(1, "Vui lòng nhập slug").max(100),
  typeValue: z.string().min(1, "Vui lòng nhập type value").max(50),
  image: z.string().max(500).optional().default(""),
  priceFrom: z.number().min(0).optional().default(0),
  stock: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const updateCategoryItemSchema = z.object({
  name: z.string().max(100).optional(),
  slug: z.string().max(100).optional(),
  typeValue: z.string().max(50).optional(),
  image: z.string().max(500).optional(),
  priceFrom: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// ─── POPUP ─────────────────────────────────────────────────────────────────

const displayPagesEnum = z.enum([
  "home",
  "shop",
  "compare",
  "account-detail",
  "order-history",
  "profile",
  "all",
]);

export const createPopupSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề").max(200),
  type: z.enum(["notification", "promotion"]),
  content: z.string().optional().default(""),
  imageUrl: z.string().max(500).optional().default(""),
  imageMobileUrl: z.string().max(500).optional().default(""),
  ctaText: z.string().max(100).optional().default(""),
  ctaLink: z.string().max(500).optional().default(""),
  displayPages: z.array(displayPagesEnum).min(1, "Chọn ít nhất 1 trang").default(["home"]),
  triggerType: z.enum(["timeout", "click"]).optional().default("timeout"),
  triggerDelay: z.number().int().min(0).optional().default(5),
  startDate: z.string().datetime().nullable().optional().default(null),
  endDate: z.string().datetime().nullable().optional().default(null),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const updatePopupSchema = z.object({
  title: z.string().max(200).optional(),
  type: z.enum(["notification", "promotion"]).optional(),
  content: z.string().optional(),
  imageUrl: z.string().max(500).optional(),
  imageMobileUrl: z.string().max(500).optional(),
  ctaText: z.string().max(100).optional(),
  ctaLink: z.string().max(500).optional(),
  displayPages: z.array(displayPagesEnum).min(1).optional(),
  triggerType: z.enum(["timeout", "click"]).optional(),
  triggerDelay: z.number().int().min(0).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// ─── BANNER ────────────────────────────────────────────────────────────────

export const createBannerSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề").max(200),
  imageDesktopUrl: z.string().min(1, "Vui lòng chọn ảnh desktop").max(500),
  imageMobileUrl: z.string().max(500).optional().default(""),
  headline: z.string().max(200).optional().default(""),
  description: z.string().max(500).optional().default(""),
  ctaText: z.string().max(100).optional().default(""),
  ctaLink: z.string().max(500).optional().default(""),
  startDate: z.string().datetime().nullable().optional().default(null),
  endDate: z.string().datetime().nullable().optional().default(null),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const updateBannerSchema = z.object({
  title: z.string().max(200).optional(),
  imageDesktopUrl: z.string().max(500).optional(),
  imageMobileUrl: z.string().max(500).optional(),
  headline: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  ctaText: z.string().max(100).optional(),
  ctaLink: z.string().max(500).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// ─── CMS PAGE ──────────────────────────────────────────────────────────────

export const updateCmsPageSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề").max(200).optional(),
  content: z.string().optional(),
  metaTitle: z.string().max(200).optional().default(""),
  metaDescription: z.string().max(500).optional().default(""),
  isActive: z.boolean().optional(),
});
