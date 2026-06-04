import express from "express";
import {
  adminProtect,
  requireRole,
} from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createGameCategorySchema,
  updateGameCategorySchema,
  createCategoryItemSchema,
  updateCategoryItemSchema,
  createPopupSchema,
  updatePopupSchema,
  createBannerSchema,
  updateBannerSchema,
  updateCmsPageSchema,
} from "../../validation/ui.validation.js";
import {
  // Game Category
  listGameCategories,
  getGameCategory,
  createGameCategory,
  updateGameCategory,
  deleteGameCategory,
  // Category Item
  listCategoryItems,
  createCategoryItem,
  updateCategoryItem,
  deleteCategoryItem,
  reorderCategoryItems,
  // Popup
  listPopups,
  getPopup,
  createPopup,
  updatePopup,
  deletePopup,
  togglePopupActive,
  // Banner
  listBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  // Popup
  reorderPopups,
  // CMS Page
  listCmsPages,
  getCmsPage,
  updateCmsPage,
  // Public
  getPublicCategories,
  getPublicPopups,
  getPublicBanners,
  getPublicCmsPage,
  getPublicScrollingText,
} from "../../controllers/admin/ui.controller.js";

const router = express.Router();

// ═════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES — require auth + super_admin role
// ═════════════════════════════════════════════════════════════════════════

const adminRouter = express.Router();
adminRouter.use(adminLimiter);
adminRouter.use(adminProtect);
adminRouter.use(requireRole("super_admin"));

// ─── Game Categories ──────────────────────────────────────────────────────
adminRouter.get("/categories/games", listGameCategories);
adminRouter.get("/categories/games/:id", getGameCategory);
adminRouter.post("/categories/games", validate(createGameCategorySchema), createGameCategory);
adminRouter.put("/categories/games/:id", validate(updateGameCategorySchema), updateGameCategory);
adminRouter.delete("/categories/games/:id", deleteGameCategory);

// ─── Category Items (embedded in GameCategory) ────────────────────────────
adminRouter.get("/categories/games/:gameId/items", listCategoryItems);
adminRouter.post("/categories/games/:gameId/items", validate(createCategoryItemSchema), createCategoryItem);
adminRouter.put("/categories/games/:gameId/items/:itemId", validate(updateCategoryItemSchema), updateCategoryItem);
adminRouter.delete(
  "/categories/games/:gameId/items/:itemId",
  deleteCategoryItem,
);
adminRouter.patch(
  "/categories/games/:gameId/items/reorder",
  reorderCategoryItems,
);

// ─── Popups ───────────────────────────────────────────────────────────────
adminRouter.get("/popups", listPopups);
adminRouter.get("/popups/:id", getPopup);
adminRouter.post("/popups", validate(createPopupSchema), createPopup);
adminRouter.put("/popups/:id", validate(updatePopupSchema), updatePopup);
adminRouter.delete("/popups/:id", deletePopup);
adminRouter.patch("/popups/:id/toggle", togglePopupActive);
adminRouter.patch("/popups/reorder", reorderPopups);

// ─── Banners ──────────────────────────────────────────────────────────────
adminRouter.get("/banners", listBanners);
adminRouter.get("/banners/:id", getBanner);
adminRouter.post("/banners", validate(createBannerSchema), createBanner);
adminRouter.put("/banners/:id", validate(updateBannerSchema), updateBanner);
adminRouter.delete("/banners/:id", deleteBanner);
adminRouter.patch("/banners/reorder", reorderBanners);

// ─── CMS Pages ────────────────────────────────────────────────────────────
adminRouter.get("/pages", listCmsPages);
adminRouter.get("/pages/:id", getCmsPage);
adminRouter.put("/pages/:id", validate(updateCmsPageSchema), updateCmsPage);

// ═════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES — không yêu cầu auth
// ═════════════════════════════════════════════════════════════════════════

const publicRouter = express.Router();

publicRouter.get("/categories", getPublicCategories);
publicRouter.get("/popups", getPublicPopups);
publicRouter.get("/banners", getPublicBanners);
publicRouter.get("/scrolling-text", getPublicScrollingText);
publicRouter.get("/pages/:slug", getPublicCmsPage);

export { adminRouter, publicRouter };
