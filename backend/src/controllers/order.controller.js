import mongoose from "mongoose";
import Account from "../models/Account.model.js";
import User from "../models/client/User.model.js";
import { generateId } from "../utils/generateId.js";
import Order from "../models/Order.model.js";
import Giftcode from "../models/Giftcode.model.js";
import { asyncHandler, AppError } from "../middlewares/errorHandler.js";
import { calculateDiscount } from "./giftcode.controller.js";
import { notifyNewOrder } from "../services/telegram.service.js";
import { releaseAccount, sellAccount } from "../services/accountReservation.service.js";
import { logBalanceChange } from "../services/auditLogger.service.js";
import { pushMarqueeEvent } from "../services/marquee.service.js";

// ─────────────────────────────────────────────────────────────────
// PURCHASE ACCOUNT (Balance payment)
// POST /api/orders/:accountId/purchase
//
// Uses atomic status-based locking to prevent race conditions.
// Flow:
//   1. Atomically reserve account (status: available → reserved)
//   2. Validate discount
//   3. Atomically deduct balance (with $inc + balance check)
//   4. Atomically sell account (status: reserved → sold)
//   5. Create completed order
// ─────────────────────────────────────────────────────────────────
export const purchaseAccount = asyncHandler(async (req, res) => {
  const { accountId } = req.params;
  const { discountCode } = req.body;
  const userId = req.user._id;

  // ── 1. Atomic reserve ───────────────────────────────────────────
  const account = await Account.atomicReserve(accountId, userId);

  if (!account) {
    throw new AppError(
      "Tài khoản không tồn tại, đã được bán hoặc đang có người thanh toán",
      400,
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      await releaseAccount(accountId); // Compensate reserve
      throw new AppError("Không tìm thấy user", 404);
    }

    // ── 2. Tính giá sau giảm ──────────────────────────────────────
    let finalAmount = account.price;
    let discountData = null;

    if (discountCode) {
      const giftcode = await Giftcode.findOne({
        code: discountCode.toUpperCase().trim(),
        isDeleted: false,
      }).session(session);

      if (!giftcode || !giftcode.isValid) {
        await session.abortTransaction();
        await releaseAccount(accountId);
        throw new AppError("Mã giảm giá không hợp lệ hoặc đã hết hạn", 400);
      }

      if (account.price < giftcode.minOrderAmount) {
        await session.abortTransaction();
        await releaseAccount(accountId);
        throw new AppError(
          `Đơn hàng tối thiểu ${giftcode.minOrderAmount.toLocaleString("vi-VN")}đ để áp dụng mã`,
          400,
        );
      }

      if (giftcode.gameFilter && giftcode.gameFilter !== account.game) {
        await session.abortTransaction();
        await releaseAccount(accountId);
        throw new AppError(
          `Mã này chỉ áp dụng cho game ${giftcode.gameFilter}`,
          400,
        );
      }

      const discountResult = calculateDiscount(giftcode, account.price);
      finalAmount = discountResult.finalAmount;

      giftcode.usedCount += 1;
      await giftcode.save({ session });

      discountData = {
        code: giftcode.code,
        type: giftcode.type,
        value: giftcode.value,
        amount: discountResult.discountAmount,
      };
    }

    // ── 3. Atomic balance deduction ───────────────────────────────
    const balanceResult = await User.findOneAndUpdate(
      {
        _id: userId,
        balance: { $gte: finalAmount },
      },
      {
        $inc: { balance: -finalAmount },
      },
      { session, new: true, select: "balance" },
    );

    if (!balanceResult) {
      await session.abortTransaction();
      await releaseAccount(accountId);
      throw new AppError(
        `Số dư không đủ. Cần ${finalAmount.toLocaleString("vi-VN")}đ`,
        400,
      );
    }

    const newBalance = balanceResult.balance;

    // ── 4. Atomic sell ────────────────────────────────────────────
    const sold = await sellAccount(accountId, userId, session);
    if (!sold) {
      await session.abortTransaction();
      throw new AppError("Không thể hoàn tất giao dịch, vui lòng thử lại", 500);
    }

    // ── 5. Tạo completed order ────────────────────────────────────
    const transactionId = generateId();

    const [order] = await Order.create(
      [
        {
          user: userId,
          account: accountId,
          amount: finalAmount,
          originalPrice: account.price,
          paymentMethod: "balance",
          status: "completed",
          transactionId,
          completedAt: new Date(),
          notes: `Mua tài khoản ${account.title}${discountData ? ` (giảm ${discountData.amount.toLocaleString("vi-VN")}đ)` : ""}`,
          ...(discountData ? { discount: discountData } : {}),
        },
      ],
      { session },
    );

    await session.commitTransaction();

      // ── Push marquee event ────────────────────────────────────
    pushMarqueeEvent("purchase", user.displayName || user.username, {
      item: account.title,
      amount: finalAmount,
    });

    // Telegram notification (silent fail)
    notifyNewOrder(
      user.displayName || user.username,
      account.title,
      finalAmount,
      transactionId,
    );

    // ── Audit log ────────────────────────────────────────────────
    logBalanceChange({
      userId: user._id,
      userName: user.displayName || user.username,
      type: "purchase",
      amount: -finalAmount,
      balanceBefore: newBalance + finalAmount,
      balanceAfter: newBalance,
      reference: transactionId,
      note: `Mua tài khoản ${account.title}${discountData ? ` (giảm ${discountData.amount.toLocaleString("vi-VN")}đ)` : ""}`,
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Mua tài khoản thành công",
      data: {
        order: order[0],
        account: {
          _id: account._id,
          title: account.title,
          loginInfo: account.loginInfo,
        },
        newBalance,
        ...(discountData ? { discount: discountData } : {}),
      },
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, status } = req.query;

  const filter = { user: userId };
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("account", "title game price images type attributes loginInfo")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    message: "Lấy danh sách đơn hàng thành công",
    data: {
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalItems: total,
    },
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const order = await Order.findOne({ _id: id, user: userId })
    .populate("account", "title game price images loginInfo attributes")
    .lean();

  if (!order) {
    throw new AppError("Không tìm thấy đơn hàng", 404);
  }

  res.json({
    success: true,
    data: { order },
  });
});

/**
 * Cancel a pending order (e.g., PayOS payment expired or cancelled by user)
 *
 * 🐛 FIXED BUG: Old code set `isSold: false` on the account — WRONG!
 *    The account was NEVER sold, it was only reserved.
 *    Now correctly releases the reservation (status: reserved → available).
 *
 * @param {string} orderId - Order ID to cancel
 */
export const cancelPendingOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const order = await Order.findOne({
    _id: id,
    user: userId,
    status: "pending",
  });

  if (!order) {
    throw new AppError("Không tìm thấy đơn hàng đang chờ", 404);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ✅ CORRECT: release reservation, don't touch sold fields
    await releaseAccount(order.account);

    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancelledReason = "Huỷ bởi người dùng";
    await order.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Đã huỷ đơn hàng",
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});
