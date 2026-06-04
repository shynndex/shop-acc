import { asyncHandler, AppError } from "../../middlewares/errorHandler.js";
import { logAdminAction } from "../../services/adminAudit.service.js";
import GameCategory from "../../models/admin/GameCategory.model.js";
import Popup from "../../models/admin/Popup.model.js";
import Banner from "../../models/admin/Banner.model.js";
import CmsPage from "../../models/admin/CmsPage.model.js";
import Account from "../../models/Account.model.js";
// ═════════════════════════════════════════════════════════════════════════
// GAME CATEGORY — CRUD
// ═════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/ui/categories/games
 * List all game categories
 */
export const listGameCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, isActive } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const [games, totalItems] = await Promise.all([
    GameCategory.find(filter)
      .sort({ sortOrder: 1, gameName: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    GameCategory.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      games,
      totalPages: Math.ceil(totalItems / limitNum),
      currentPage: pageNum,
      totalItems,
    },
  });
});

/**
 * GET /api/admin/ui/categories/games/:id
 * Get single game category by ID
 */
export const getGameCategory = asyncHandler(async (req, res) => {
  const game = await GameCategory.findById(req.params.id);
  if (!game) throw new AppError("Game không tồn tại", 404);
  res.json({ success: true, data: game });
});

/**
 * POST /api/admin/ui/categories/games
 * Create a new game category
 */
export const createGameCategory = asyncHandler(async (req, res) => {
  const game = await GameCategory.create(req.body);

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:gameCategory:create",
    resource: "gameCategory",
    resourceId: game._id,
    details: { gameSlug: game.gameSlug, gameName: game.gameName },
    ip: req.ip,
  });

  res.status(201).json({ success: true, data: game });
});

/**
 * PUT /api/admin/ui/categories/games/:id
 * Update a game category
 */
export const updateGameCategory = asyncHandler(async (req, res) => {
  const game = await GameCategory.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
  );
  if (!game) throw new AppError("Game không tồn tại", 404);

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:gameCategory:update",
    resource: "gameCategory",
    resourceId: game._id,
    details: { gameSlug: game.gameSlug, gameName: game.gameName },
    ip: req.ip,
  });

  res.json({ success: true, data: game });
});

/**
 * DELETE /api/admin/ui/categories/games/:id
 * Delete a game category (only if no accounts reference it)
 */
export const deleteGameCategory = asyncHandler(async (req, res) => {
  const game = await GameCategory.findById(req.params.id);
  if (!game) throw new AppError("Game không tồn tại", 404);

  // Check if any accounts reference this game
  const accountCount = await Account.countDocuments({ game: game.gameSlug });
  if (accountCount > 0) {
    throw new AppError(
      `Không thể xoá game "${game.gameName}" vì có ${accountCount} tài khoản đang thuộc game này. Hãy chuyển tài khoản sang game khác trước.`,
      400,
    );
  }

  await GameCategory.findByIdAndDelete(req.params.id);

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:gameCategory:delete",
    resource: "gameCategory",
    resourceId: game._id,
    details: { gameSlug: game.gameSlug, gameName: game.gameName },
    ip: req.ip,
  });

  res.json({ success: true, message: `Đã xoá game "${game.gameName}"` });
});

// ═════════════════════════════════════════════════════════════════════════
// CATEGORY ITEM — CRUD (embedded in GameCategory)
// ═════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/ui/categories/games/:gameId/items
 * List all category items for a game
 */
export const listCategoryItems = asyncHandler(async (req, res) => {
  const game = await GameCategory.findById(req.params.gameId);
  if (!game) throw new AppError("Game không tồn tại", 404);

  res.json({ success: true, data: { categories: game.categories } });
});

/**
 * POST /api/admin/ui/categories/games/:gameId/items
 * Add a new category item to a game
 */
export const createCategoryItem = asyncHandler(async (req, res) => {
  const game = await GameCategory.findById(req.params.gameId);
  if (!game) throw new AppError("Game không tồn tại", 404);

  // Check duplicate id within game
  const exists = game.categories.find((cat) => cat.id === req.body.id);
  if (exists) {
    throw new AppError(`ID danh mục "${req.body.id}" đã tồn tại trong game này`, 409);
  }

  game.categories.push(req.body);
  await game.save();

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:categoryItem:create",
    resource: "gameCategory",
    resourceId: game._id,
    details: { gameSlug: game.gameSlug, categoryName: req.body.name },
    ip: req.ip,
  });

  res.status(201).json({ success: true, data: game });
});

/**
 * PUT /api/admin/ui/categories/games/:gameId/items/:itemId
 * Update a category item
 */
export const updateCategoryItem = asyncHandler(async (req, res) => {
  const game = await GameCategory.findById(req.params.gameId);
  if (!game) throw new AppError("Game không tồn tại", 404);

  const item = game.categories.id(req.params.itemId);
  if (!item) throw new AppError("Danh mục không tồn tại", 404);

  Object.keys(req.body).forEach((key) => {
    if (req.body[key] !== undefined) {
      item[key] = req.body[key];
    }
  });

  await game.save();

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:categoryItem:update",
    resource: "gameCategory",
    resourceId: game._id,
    details: { gameSlug: game.gameSlug, itemId: req.params.itemId },
    ip: req.ip,
  });

  res.json({ success: true, data: game });
});

/**
 * DELETE /api/admin/ui/categories/games/:gameId/items/:itemId
 * Delete a category item
 */
export const deleteCategoryItem = asyncHandler(async (req, res) => {
  const game = await GameCategory.findById(req.params.gameId);
  if (!game) throw new AppError("Game không tồn tại", 404);

  const item = game.categories.id(req.params.itemId);
  if (!item) throw new AppError("Danh mục không tồn tại", 404);

  item.deleteOne();
  await game.save();

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:categoryItem:delete",
    resource: "gameCategory",
    resourceId: game._id,
    details: { gameSlug: game.gameSlug, itemId: req.params.itemId, itemName: item.name },
    ip: req.ip,
  });

  res.json({ success: true, message: `Đã xoá danh mục "${item.name}"` });
});

// ═════════════════════════════════════════════════════════════════════════
// POPUP — CRUD
// ═════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/ui/popups
 * List all popups
 */
export const listPopups = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, isActive, type } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (type) filter.type = type;

  const [popups, totalItems] = await Promise.all([
    Popup.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Popup.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      popups,
      totalPages: Math.ceil(totalItems / limitNum),
      currentPage: pageNum,
      totalItems,
    },
  });
});

/**
 * GET /api/admin/ui/popups/:id
 * Get single popup
 */
export const getPopup = asyncHandler(async (req, res) => {
  const popup = await Popup.findById(req.params.id);
  if (!popup) throw new AppError("Popup không tồn tại", 404);
  res.json({ success: true, data: popup });
});

/**
 * POST /api/admin/ui/popups
 * Create a new popup
 */
export const createPopup = asyncHandler(async (req, res) => {
  const popup = await Popup.create(req.body);

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:popup:create",
    resource: "popup",
    resourceId: popup._id,
    details: { title: popup.title, type: popup.type },
    ip: req.ip,
  });

  res.status(201).json({ success: true, data: popup });
});

/**
 * PUT /api/admin/ui/popups/:id
 * Update a popup
 */
export const updatePopup = asyncHandler(async (req, res) => {
  const popup = await Popup.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
  );
  if (!popup) throw new AppError("Popup không tồn tại", 404);

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:popup:update",
    resource: "popup",
    resourceId: popup._id,
    details: { title: popup.title },
    ip: req.ip,
  });

  res.json({ success: true, data: popup });
});

/**
 * DELETE /api/admin/ui/popups/:id
 * Delete a popup
 */
export const deletePopup = asyncHandler(async (req, res) => {
  const popup = await Popup.findByIdAndDelete(req.params.id);
  if (!popup) throw new AppError("Popup không tồn tại", 404);

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:popup:delete",
    resource: "popup",
    resourceId: popup._id,
    details: { title: popup.title },
    ip: req.ip,
  });

  res.json({ success: true, message: `Đã xoá popup "${popup.title}"` });
});

/**
 * PATCH /api/admin/ui/popups/:id/toggle
 * Toggle popup active status
 */
export const togglePopupActive = asyncHandler(async (req, res) => {
  const popup = await Popup.findById(req.params.id);
  if (!popup) throw new AppError("Popup không tồn tại", 404);

  popup.isActive = !popup.isActive;
  await popup.save();

  res.json({ success: true, data: popup });
});

// ═════════════════════════════════════════════════════════════════════════
// BANNER — CRUD
// ═════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/ui/banners
 * List all banners
 */
export const listBanners = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, isActive } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const [banners, totalItems] = await Promise.all([
    Banner.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Banner.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      banners,
      totalPages: Math.ceil(totalItems / limitNum),
      currentPage: pageNum,
      totalItems,
    },
  });
});

/**
 * GET /api/admin/ui/banners/:id
 * Get single banner
 */
export const getBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) throw new AppError("Banner không tồn tại", 404);
  res.json({ success: true, data: banner });
});

/**
 * POST /api/admin/ui/banners
 * Create a new banner
 */
export const createBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:banner:create",
    resource: "banner",
    resourceId: banner._id,
    details: { title: banner.title },
    ip: req.ip,
  });

  res.status(201).json({ success: true, data: banner });
});

/**
 * PUT /api/admin/ui/banners/:id
 * Update a banner
 */
export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
  );
  if (!banner) throw new AppError("Banner không tồn tại", 404);

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:banner:update",
    resource: "banner",
    resourceId: banner._id,
    details: { title: banner.title },
    ip: req.ip,
  });

  res.json({ success: true, data: banner });
});

/**
 * DELETE /api/admin/ui/banners/:id
 * Delete a banner
 */
export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw new AppError("Banner không tồn tại", 404);

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:banner:delete",
    resource: "banner",
    resourceId: banner._id,
    details: { title: banner.title },
    ip: req.ip,
  });

  res.json({ success: true, message: `Đã xoá banner "${banner.title}"` });
});

// ═════════════════════════════════════════════════════════════════════════
// CMS PAGE — CRUD
// ═════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/ui/pages
 * List all CMS pages
 */
export const listCmsPages = asyncHandler(async (req, res) => {
  const pages = await CmsPage.find().sort({ slug: 1 });
  res.json({ success: true, data: { pages } });
});

/**
 * GET /api/admin/ui/pages/:id
 * Get single CMS page
 */
export const getCmsPage = asyncHandler(async (req, res) => {
  const page = await CmsPage.findById(req.params.id);
  if (!page) throw new AppError("Trang không tồn tại", 404);
  res.json({ success: true, data: page });
});

/**
 * PUT /api/admin/ui/pages/:id
 * Update a CMS page (no create/delete — fixed pages)
 */
export const updateCmsPage = asyncHandler(async (req, res) => {
  const page = await CmsPage.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
  );
  if (!page) throw new AppError("Trang không tồn tại", 404);

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:cmsPage:update",
    resource: "cmsPage",
    resourceId: page._id,
    details: { slug: page.slug },
    ip: req.ip,
  });

  res.json({ success: true, data: page });
});

// ═════════════════════════════════════════════════════════════════════════
// REORDER — Drag & Drop sort
// ═════════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/admin/ui/categories/games/:gameId/items/reorder
 * Reorder category items within a game
 */
export const reorderCategoryItems = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ id: string, sortOrder: number }]

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Danh sách items không hợp lệ", 400);
  }

  const game = await GameCategory.findById(req.params.gameId);
  if (!game) throw new AppError("Game không tồn tại", 404);

  // Update sortOrder for each item by matching the custom `id` field
  for (const { id, sortOrder } of items) {
    const item = game.categories.find((cat) => cat.id === id);
    if (item) {
      item.sortOrder = sortOrder;
    }
  }

  // Re-sort the categories array in-memory based on sortOrder
  game.categories.sort((a, b) => a.sortOrder - b.sortOrder);

  await game.save();

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:categoryItems:reorder",
    resource: "gameCategory",
    resourceId: game._id,
    details: { gameSlug: game.gameSlug, count: items.length },
    ip: req.ip,
  });

  res.json({ success: true, message: "Đã cập nhật thứ tự danh mục" });
});

/**
 * PATCH /api/admin/ui/banners/reorder
 * Reorder banners (bulk update sortOrder)
 */
export const reorderBanners = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ _id, sortOrder }]

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Danh sách items không hợp lệ", 400);
  }

  const bulkOps = items.map((item, index) => ({
    updateOne: {
      filter: { _id: item._id },
      update: { $set: { sortOrder: item.sortOrder ?? index } },
    },
  }));

  await Banner.bulkWrite(bulkOps);

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:banner:reorder",
    resource: "banner",
    resourceId: null,
    details: { count: items.length },
    ip: req.ip,
  });

  res.json({ success: true, message: "Đã cập nhật thứ tự banner" });
});

/**
 * PATCH /api/admin/ui/popups/reorder
 * Reorder popups (bulk update sortOrder)
 */
export const reorderPopups = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ _id, sortOrder }]

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Danh sách items không hợp lệ", 400);
  }

  const bulkOps = items.map((item, index) => ({
    updateOne: {
      filter: { _id: item._id },
      update: { $set: { sortOrder: item.sortOrder ?? index } },
    },
  }));

  await Popup.bulkWrite(bulkOps);

  await logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "ui:popup:reorder",
    resource: "popup",
    resourceId: null,
    details: { count: items.length },
    ip: req.ip,
  });

  res.json({ success: true, message: "Đã cập nhật thứ tự popup" });
});

// ═════════════════════════════════════════════════════════════════════════
// PUBLIC API — không yêu cầu auth
// ═════════════════════════════════════════════════════════════════════════

/**
 * GET /api/ui/categories
 * Public: get active game categories (thay thế categories.ts hardcode)
 */
export const getPublicCategories = asyncHandler(async (req, res) => {
  const games = await GameCategory.find({ isActive: true })
    .sort({ sortOrder: 1, gameName: 1 })
    .lean();

  // Filter out inactive categories
  const result = games.map((game) => ({
    ...game,
    categories: game.categories.filter((cat) => cat.isActive),
  }));

  res.json({ success: true, data: { games: result } });
});

/**
 * GET /api/ui/popups
 * Public: get active popups for a given page
 * Query: ?page=home
 */
export const getPublicPopups = asyncHandler(async (req, res) => {
  const { page } = req.query;
  const now = new Date();

  const filter = {
    isActive: true,
    $and: [
      {
        $or: [
          { startDate: null },
          { startDate: { $lte: now } },
        ],
      },
      {
        $or: [
          { endDate: null },
          { endDate: { $gte: now } },
        ],
      },
    ],
  };

  // If page specified, filter by displayPages
  if (page && page !== "all") {
    filter.displayPages = { $in: [page, "all"] };
  }

  const popups = await Popup.find(filter)
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  res.json({ success: true, data: { popups } });
});

/**
 * GET /api/ui/banners
 * Public: get active banners sorted by sortOrder
 */
export const getPublicBanners = asyncHandler(async (req, res) => {
  const now = new Date();

  const banners = await Banner.find({
    isActive: true,
    $and: [
      {
        $or: [
          { startDate: null },
          { startDate: { $lte: now } },
        ],
      },
      {
        $or: [
          { endDate: null },
          { endDate: { $gte: now } },
        ],
      },
    ],
  })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  res.json({ success: true, data: { banners } });
});

/**
 * GET /api/ui/pages/:slug
 * Public: get CMS page by slug
 */
export const getPublicCmsPage = asyncHandler(async (req, res) => {
  const page = await CmsPage.findOne({
    slug: req.params.slug,
    isActive: true,
  }).lean();

  if (!page) throw new AppError("Trang không tồn tại", 404);

  res.json({ success: true, data: page });
});

/**
 * GET /api/ui/scrolling-text
 * Public: get scrolling marquee text content
 */
export const getPublicScrollingText = asyncHandler(async (req, res) => {
  const text =
    process.env.SCROLLING_TEXT ||
    "🔥 ShopSam — Nền tảng giao dịch tài khoản game uy tín hàng đầu Việt Nam | 🔒 Bảo mật 100% | ⚡ Nạp tiền tự động | 💎 Hỗ trợ 24/7 | 🎮 Đa dạng game: Liên Quân, Valorant, Free Fire, LMHT";

  res.json({ success: true, data: { text, isActive: true } });
});
