import Promotion from "../../models/admin/Promotion.model.js";
import { asyncHandler, AppError } from "../../middlewares/errorHandler.js";

/**
 * GET /api/admin/promotions
 * List all promotions (admin)
 */
export const listPromotions = asyncHandler(async (req, res) => {
  const promotions = await Promotion.find()
    .sort({ createdAt: -1 })
    .populate("lastUpdatedBy", "username");

  res.json({ success: true, data: promotions });
});

/**
 * GET /api/admin/promotions/:id
 * Get single promotion (admin)
 */
export const getPromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id).populate(
    "lastUpdatedBy",
    "username"
  );

  if (!promotion) {
    throw new AppError("Chương trình khuyến mãi không tồn tại", 404);
  }

  res.json({ success: true, data: promotion });
});

/**
 * POST /api/admin/promotions
 * Create promotion (admin)
 */
export const createPromotion = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    isActive,
    minDepositAmount,
    rewardType,
    rewardAmount,
    rewardSpins,
    startDate,
    endDate,
  } = req.body;

  if (!name || !rewardType || !startDate || !endDate) {
    throw new AppError("Thiếu thông tin bắt buộc", 400);
  }

  if (new Date(startDate) >= new Date(endDate)) {
    throw new AppError("Ngày kết thúc phải sau ngày bắt đầu", 400);
  }

  const promotion = await Promotion.create({
    name,
    description,
    isActive,
    minDepositAmount,
    rewardType,
    rewardAmount,
    rewardSpins,
    startDate,
    endDate,
    lastUpdatedBy: req.admin._id,
  });

  res.status(201).json({
    success: true,
    message: "Tạo chương trình khuyến mãi thành công",
    data: promotion,
  });
});

/**
 * PUT /api/admin/promotions/:id
 * Update promotion (admin)
 */
export const updatePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError("Chương trình khuyến mãi không tồn tại", 404);
  }

  const allowedFields = [
    "name",
    "description",
    "isActive",
    "minDepositAmount",
    "rewardType",
    "rewardAmount",
    "rewardSpins",
    "startDate",
    "endDate",
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      promotion[field] = req.body[field];
    }
  }
  promotion.lastUpdatedBy = req.admin._id;

  await promotion.save();

  res.json({
    success: true,
    message: "Cập nhật chương trình khuyến mãi thành công",
    data: promotion,
  });
});

/**
 * DELETE /api/admin/promotions/:id
 * Delete promotion (admin)
 */
export const deletePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findByIdAndDelete(req.params.id);

  if (!promotion) {
    throw new AppError("Chương trình khuyến mãi không tồn tại", 404);
  }

  res.json({
    success: true,
    message: "Đã xóa chương trình khuyến mãi",
  });
});

/**
 * PATCH /api/admin/promotions/:id/toggle
 * Toggle promotion active status (admin)
 */
export const togglePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    throw new AppError("Chương trình khuyến mãi không tồn tại", 404);
  }

  promotion.isActive = !promotion.isActive;
  promotion.lastUpdatedBy = req.admin._id;
  await promotion.save();

  res.json({
    success: true,
    message: promotion.isActive ? "Đã kích hoạt khuyến mãi" : "Đã tắt khuyến mãi",
    data: promotion,
  });
});

/**
 * GET /api/ui/promotions/active
 * Public: get active promotions
 */
export const getActivePromotions = asyncHandler(async (req, res) => {
  const now = new Date();
  const promotions = await Promotion.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).select("name description minDepositAmount rewardType rewardAmount rewardSpins");

  res.json({ success: true, data: promotions });
});
