import Giftcode from "../models/Giftcode.model.js";
import { asyncHandler, AppError } from "../middlewares/errorHandler.js";
import { logAdminAction } from "../services/adminAudit.service.js";

// ─── RATE LIMITER (in-memory) ────────────────────────────────────────────
const rateLimitMap = new Map();

const checkRateLimit = (ip) => {
  const key = ip || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 phút
  const maxAttempts = 5;

  const record = rateLimitMap.get(key);
  if (!record || now - record.windowStart > windowMs) {
    rateLimitMap.set(key, { windowStart: now, count: 1 });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
};

// ─── ADMIN CRUD ──────────────────────────────────────────────────────────

/** GET /api/admin/giftcodes */
export const listGiftcodes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status } = req.query;
  const filter = { isDeleted: false };

  if (search) {
    filter.code = { $regex: search, $options: "i" };
  }

  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;

  const [giftcodes, total] = await Promise.all([
    Giftcode.find(filter)
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(),
    Giftcode.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      giftcodes,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalItems: total,
    },
  });
});

/** POST /api/admin/giftcodes */
export const createGiftcode = asyncHandler(async (req, res) => {
  const { code, type, value, minOrderAmount, maxUses, gameFilter, expiresAt } =
    req.body;

  if (!code || !type || value === undefined) {
    throw new AppError("Vui lòng nhập mã code, loại và giá trị giảm", 400);
  }

  if (!["percent", "fixed"].includes(type)) {
    throw new AppError("Loại giảm giá không hợp lệ (percent/fixed)", 400);
  }

  if (type === "percent" && (value <= 0 || value > 100)) {
    throw new AppError("Giá trị phần trăm phải từ 1-100", 400);
  }

  if (type === "fixed" && value <= 0) {
    throw new AppError("Giá trị giảm phải lớn hơn 0", 400);
  }

  const existing = await Giftcode.findOne({ code: code.toUpperCase().trim() });
  if (existing) {
    throw new AppError("Mã giftcode đã tồn tại", 409);
  }

  const giftcode = await Giftcode.create({
    code: code.toUpperCase().trim(),
    type,
    value,
    minOrderAmount: minOrderAmount || 0,
    maxUses: maxUses || null,
    gameFilter: gameFilter || null,
    expiresAt: expiresAt || null,
    createdBy: req.admin._id,
  });

  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "giftcode:create",
    resource: "giftcode",
    resourceId: giftcode._id,
    details: { code: giftcode.code, type: giftcode.type, value: giftcode.value },
    ip: req.ip,
  });

  res.status(201).json({
    success: true,
    message: "Tạo giftcode thành công",
    data: { giftcode },
  });
});

/** PUT /api/admin/giftcodes/:id */
export const updateGiftcode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, value, minOrderAmount, maxUses, gameFilter, expiresAt, isActive } =
    req.body;

  const giftcode = await Giftcode.findById(id);
  if (!giftcode) {
    throw new AppError("Không tìm thấy giftcode", 404);
  }

  if (type !== undefined) giftcode.type = type;
  if (value !== undefined) giftcode.value = value;
  if (minOrderAmount !== undefined) giftcode.minOrderAmount = minOrderAmount;
  if (maxUses !== undefined) giftcode.maxUses = maxUses;
  if (gameFilter !== undefined) giftcode.gameFilter = gameFilter;
  if (expiresAt !== undefined) giftcode.expiresAt = expiresAt;
  if (isActive !== undefined) giftcode.isActive = isActive;

  await giftcode.save();

  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "giftcode:update",
    resource: "giftcode",
    resourceId: giftcode._id,
    details: { code: giftcode.code, changes: Object.keys(req.body) },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: "Cập nhật giftcode thành công",
    data: { giftcode },
  });
});

/** DELETE /api/admin/giftcodes/:id (soft delete) */
export const deleteGiftcode = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const giftcode = await Giftcode.findByIdAndUpdate(id, {
    $set: { isDeleted: true, isActive: false },
  });

  if (!giftcode) {
    throw new AppError("Không tìm thấy giftcode", 404);
  }

  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "giftcode:delete",
    resource: "giftcode",
    resourceId: giftcode._id,
    details: { code: giftcode.code },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: "Xoá giftcode thành công",
  });
});

// ─── CLIENT ──────────────────────────────────────────────────────────────

/** Calculate discount for a given amount */
export const calculateDiscount = (giftcode, amount) => {
  let discountAmount = 0;

  if (giftcode.type === "percent") {
    discountAmount = Math.round((amount * giftcode.value) / 100);
  } else {
    discountAmount = Math.min(giftcode.value, amount);
  }

  return {
    discountAmount,
    finalAmount: amount - discountAmount,
    code: giftcode.code,
    type: giftcode.type,
    value: giftcode.value,
  };
};

/**
 * POST /api/giftcodes/validate
 * Body: { code, amount, game? }
 * Rate limited: 5/IP/phút
 */
export const validateGiftcode = asyncHandler(async (req, res) => {
  const clientIp = req.ip || req.connection?.remoteAddress || "unknown";
  if (!checkRateLimit(clientIp)) {
    throw new AppError("Bạn đã thử quá nhiều lần, vui lòng thử lại sau 1 phút", 429);
  }

  const { code, amount, game } = req.body;

  if (!code || !amount) {
    throw new AppError("Vui lòng nhập mã code và số tiền", 400);
  }

  const giftcode = await Giftcode.findOne({
    code: code.toUpperCase().trim(),
    isDeleted: false,
  });

  if (!giftcode) {
    return res.json({
      success: true,
      data: { valid: false, message: "Mã giảm giá không tồn tại" },
    });
  }

  if (!giftcode.isValid) {
    let message = "Mã giảm giá đã hết hạn hoặc không còn hiệu lực";
    if (!giftcode.isActive) message = "Mã giảm giá đã bị vô hiệu hoá";
    else if (giftcode.maxUses !== null && giftcode.usedCount >= giftcode.maxUses)
      message = "Mã giảm giá đã hết lượt sử dụng";
    else if (giftcode.expiresAt && giftcode.expiresAt < new Date())
      message = "Mã giảm giá đã hết hạn";

    return res.json({
      success: true,
      data: { valid: false, message },
    });
  }

  if (amount < giftcode.minOrderAmount) {
    return res.json({
      success: true,
      data: {
        valid: false,
        message: `Đơn hàng tối thiểu ${giftcode.minOrderAmount.toLocaleString("vi-VN")}đ để áp dụng mã này`,
      },
    });
  }

  if (giftcode.gameFilter && giftcode.gameFilter !== game) {
    return res.json({
      success: true,
      data: {
        valid: false,
        message: `Mã này chỉ áp dụng cho game ${giftcode.gameFilter}`,
      },
    });
  }

  const result = calculateDiscount(giftcode, amount);

  res.json({
    success: true,
    data: { valid: true, ...result, message: "Áp dụng mã giảm giá thành công!" },
  });
});
