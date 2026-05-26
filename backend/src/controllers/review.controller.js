import mongoose from "mongoose";
import Review from "../models/Review.model.js";
import Order from "../models/Order.model.js";
import Account from "../models/Account.model.js";
import { asyncHandler, AppError } from "../middlewares/errorHandler.js";
import { logAdminAction } from "../services/adminAudit.service.js";

// ─── Helper: Update account rating ────────────────────────────────────────

async function updateAccountRating(accountId) {
  const result = await Review.aggregate([
    { $match: { account: new mongoose.Types.ObjectId(accountId), status: "approved" } },
    { $group: { _id: "$account", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const ratingData = result[0]
    ? { avg: Math.round(result[0].avg * 10) / 10, count: result[0].count }
    : { avg: 0, count: 0 };

  await Account.findByIdAndUpdate(accountId, { rating: ratingData });
}

// ─── Create Review ────────────────────────────────────────────────────────

export const createReview = asyncHandler(async (req, res) => {
  const { accountId, orderId, rating, comment } = req.body;
  const userId = req.user._id;

  // Validate order exists and belongs to user
  const order = await Order.findOne({ _id: orderId, user: userId, account: accountId });
  if (!order) {
    throw new AppError("Bạn chưa mua tài khoản này hoặc đơn hàng không tồn tại", 400);
  }

  // Check if already reviewed this order
  const existing = await Review.findOne({ order: orderId });
  if (existing) {
    throw new AppError("Bạn đã đánh giá đơn hàng này rồi", 400);
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError("Vui lòng chọn đánh giá từ 1 đến 5 sao", 400);
  }

  const review = await Review.create({
    user: userId,
    account: accountId,
    order: orderId,
    rating,
    comment: comment || "",
    status: "pending",
  });

  const populated = await Review.findById(review._id)
    .populate("user", "username displayName avatarUrl");

  res.status(201).json({
    success: true,
    message: "Đánh giá của bạn đã được gửi và chờ admin duyệt",
    data: { review: populated },
  });
});

// ─── Update Review (within 24h) ───────────────────────────────────────────

export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  const review = await Review.findOne({ _id: id, user: userId });
  if (!review) {
    throw new AppError("Không tìm thấy đánh giá", 404);
  }

  // Check 24h limit
  const hoursSinceCreated = (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreated > 24) {
    throw new AppError("Đã quá 24h, bạn không thể chỉnh sửa đánh giá này", 400);
  }

  if (rating !== undefined) {
    if (rating < 1 || rating > 5) throw new AppError("Đánh giá từ 1 đến 5 sao", 400);
    review.rating = rating;
  }
  if (comment !== undefined) review.comment = comment;

  // Reset status to pending after edit
  review.status = "pending";
  review.moderatedBy = null;
  review.moderatedAt = null;

  await review.save();

  res.json({
    success: true,
    message: "Đã cập nhật đánh giá",
    data: { review },
  });
});

// ─── Get Public Reviews (approved, for a product) ─────────────────────────

export const getPublicReviews = asyncHandler(async (req, res) => {
  const { accountId, page = 1, limit = 10 } = req.query;

  if (!accountId) {
    throw new AppError("Thiếu accountId", 400);
  }

  const filter = { account: accountId, status: "approved" };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "username displayName avatarUrl")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      totalItems: total,
    },
  });
});

// ─── Get User's Review for an Account ─────────────────────────────────────

export const getUserReview = asyncHandler(async (req, res) => {
  const { accountId } = req.query;
  const userId = req.user._id;

  const review = await Review.findOne({
    user: userId,
    account: accountId,
  }).lean();

  res.json({ success: true, data: { review } });
});

// ─── Admin: List Reviews ──────────────────────────────────────────────────

export const adminListReviews = asyncHandler(async (req, res) => {
  const {
    status, page = 1, limit = 20, search,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "username displayName email")
      .populate("account", "title game price")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      totalItems: total,
    },
  });
});

// ─── Admin: Moderate Review ───────────────────────────────────────────────

export const moderateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    throw new AppError("Trạng thái không hợp lệ", 400);
  }

  const review = await Review.findByIdAndUpdate(
    id,
    {
      status,
      moderatedBy: req.admin._id,
      moderatedAt: new Date(),
    },
    { new: true },
  );

  if (!review) {
    throw new AppError("Không tìm thấy đánh giá", 404);
  }

  // Update account rating if approved
  if (status === "approved") {
    await updateAccountRating(review.account);
  }

  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: status === "approved" ? "review:approve" : "review:reject",
    resource: "review",
    resourceId: review._id,
    details: { status, accountId: String(review.account) },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: status === "approved" ? "Đã duyệt đánh giá" : "Đã từ chối đánh giá",
    data: { review },
  });
});

// ─── Admin: Get Review Stats ──────────────────────────────────────────────

export const adminReviewStats = asyncHandler(async (req, res) => {
  const stats = await Review.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const result = { pending: 0, approved: 0, rejected: 0 };
  for (const s of stats) {
    result[s._id] = s.count;
  }

  res.json({ success: true, data: result });
});
