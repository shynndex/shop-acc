import mongoose from "mongoose";
import { generateId } from "../utils/generateId.js";
import payOS from "../libs/payos.config.js";
import User from "../models/client/User.model.js";
import Account from "../models/Account.model.js";
import Order from "../models/Order.model.js";
import CardDeposit from "../models/client/deposits/CardDeposit.model.js";
import {
  chargeCard,
  getFeeData,
  md5,
  parseWebhookData,
  verifyWebhookSignature,
} from "../services/cardProvider.service.js";
import { hasSSEClient, sendSSE } from "../utils/sse.js";
import { encryptPin } from "../utils/encryptPin.js";
import BankDeposit from "../models/client/deposits/BankDeposit.model.js";
import BankAccount from "../models/admin/BankAccount.model.js";
import { asyncHandler, AppError } from "../middlewares/errorHandler.js";
import { calculateDiscount } from "./giftcode.controller.js";
import Giftcode from "../models/Giftcode.model.js";
import { notifyNewDeposit, notifyDepositSuccess } from "../services/telegram.service.js";
import { reserveAccount, releaseAccount } from "../services/accountReservation.service.js";
import {
  finalizePurchase,
  cancelPurchase,
} from "../services/purchaseFinalization.service.js";
import { logBalanceChange } from "../services/auditLogger.service.js";  // Helper: validate giftcode for deposit, returns bonus info or null
async function applyGiftcodeBonus(code, amount) {
  if (!code) return null;
  const giftcode = await Giftcode.findOne({
    code: code.toUpperCase().trim(),
    isDeleted: false,
  });
  if (!giftcode || !giftcode.isValid) return null;
  if (amount < giftcode.minOrderAmount) return null;

  const result = calculateDiscount(giftcode, amount);
  giftcode.usedCount += 1;
  await giftcode.save();

  return {
    code: giftcode.code,
    type: giftcode.type,
    value: giftcode.value,
    amount: result.discountAmount,
  };
}

// Helper: CAS update deposit status (idempotent, version-guarded)
async function updateDepositStatusCAS(deposit, status, setFields, session) {
  const updateVersion = deposit.version || 0;
  const update = {
    $set: { status, ...setFields },
    $inc: { version: 1 },
  };
  const result = await BankDeposit.findOneAndUpdate(
    { _id: deposit._id, status: deposit.status, version: updateVersion },
    update,
    { new: true, session },
  );
  if (!result) {
    throw new Error(
      `[CAS Conflict] Deposit ${deposit._id} status/version changed (expected status=${deposit.status}, version=${updateVersion})`,
    );
  }
  deposit.version = updateVersion + 1;
  return result;
}

export const createDepositInfo = asyncHandler(async (req, res) => {
  const activeBank = await BankAccount.findOne({ isActive: true });
  const { amount, discountCode } = req.body;

  if (!amount || amount < 10000) {
    throw new AppError("Số tiền nạp phải lớn hơn hoặc bằng 10,000 VND", 400);
  }

  if (!activeBank) {
    throw new AppError("Lỗi khi lấy ngân hàng", 404);
  }

  const referenceCode = generateId();

  // Mã đơn hàng nội bộ (PayOS yêu cầu là số, duy nhất)
  // Prefix '1' cho deposit để tránh trùng với purchase (prefix '2')
  const orderCode = Number("1" + String(Date.now()).slice(-6));

  const body = {
    orderCode,
    amount: Number(amount) || 10000,
    description: referenceCode,
    returnUrl: `${process.env.FRONTEND_URL}`,
    cancelUrl: `${process.env.FRONTEND_URL}`,
    items: [
      {
        name: "Nạp tiền vào ví ShopSamcc",
        quantity: 1,
        price: parseInt(amount),
      },
    ],
  };

  const paymentLinkResponse = await payOS.paymentRequests.create(body);

  console.log(paymentLinkResponse);

  // Giftcode bonus
  const bonus = await applyGiftcodeBonus(discountCode, parseInt(amount));

  await BankDeposit.create({
    user: req.user.id,
    bank: activeBank._id,
    referenceCode,
    expectedAmount: parseInt(amount),
    status: "PENDING",
    payosOrderId: paymentLinkResponse.id,
    orderCode,
    amount: 0,
    ...(bonus ? { discount: bonus } : {}),
  });

  // Telegram notification (silent fail)
  const currentUser = await User.findById(req.user.id).select("displayName username");
  if (currentUser) {
    notifyNewDeposit(currentUser.displayName || currentUser.username, "bank", parseInt(amount));
  }

  res.json({
    success: true,
    data: {
      bankName: activeBank.name,
      qrImage: paymentLinkResponse.qrCode,
      accountName: paymentLinkResponse.accountName,
      accountNumber: paymentLinkResponse.accountNumber,
      referenceCode, // Trả mã mới tạo về
      minDeposit: 10000,
      instruction: `Chuyển khoản bất kỳ số tiền nào với nội dung: ${referenceCode}`,
    },
  });
});

export const payosWebhook = asyncHandler(async (req, res) => {
  const body = req.body;
  const isValid = payOS.verifyPaymentWebhookData(body);

  if (!isValid) {
    return res.status(400).json({ code: "99", desc: "Invalid signature" });
  }

  const data = body.data;
  const orderCode = data.orderCode;

  // Tìm đơn hàng theo orderCode
  const deposit = await BankDeposit.findOne({
    orderCode,
    status: "PENDING",
  });

  if (!deposit) {
    return res
      .status(200)
      .json({ code: "00", desc: "Order not found or already processed" });
  }

  if (data.amount !== deposit.expectedAmount) {
    console.warn(
      `Amount mismatch: Expected ${deposit.expectedAmount}, Got ${data.amount}`,
    );
    deposit.status = "FAILED";
    await deposit.save();
    return res.status(400).json({ code: "99", desc: "Amount mismatch" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (deposit.type === "purchase") {
        // ── Purchase flow: finalizePurchase handles CAS deposit update internally
        await finalizePurchase(deposit, data, session);

        // Increment giftcode usedCount now (payment confirmed)
        if (deposit.discount?.code) {
          const giftcode = await Giftcode.findOne({
            code: deposit.discount.code,
            isDeleted: false,
          }).session(session);
          if (giftcode) {
            giftcode.usedCount += 1;
            await giftcode.save({ session });
          }
        }
      }

    if (deposit.type === "deposit") {
      // Deposit flow: CAS deposit status update + add balance
      await updateDepositStatusCAS(deposit, "PAID", { amount: data.amount, transactionData: data }, session);

      const totalCredit = data.amount + (deposit.discount?.amount || 0);
      const updatedUser = await User.findByIdAndUpdate(
        deposit.user,
        { $inc: { balance: totalCredit } },
        { session, new: true, select: "balance displayName username" },
      );

      // ── Audit log ───────────────────────────────────────────────
      if (updatedUser) {
        logBalanceChange({
          userId: deposit.user,
          userName: updatedUser.displayName || updatedUser.username,
          type: "deposit_bank",
          amount: totalCredit,
          balanceBefore: updatedUser.balance - totalCredit,
          balanceAfter: updatedUser.balance,
          reference: deposit.referenceCode,
          note: `Nạp ngân hàng${deposit.discount?.code ? ` (giảm: ${deposit.discount.code})` : ""}`,
          ip: req.ip,
        });
      }

      if (deposit.discount?.amount) {
        deposit.bonusAmount = deposit.discount.amount;
        // Synced via CAS update above — version already incremented
      }

      // Telegram notification (silent fail)
      const depositUser = await User.findById(deposit.user).select("displayName username balance");
      if (depositUser) {
        notifyDepositSuccess(
          depositUser.displayName || depositUser.username,
          totalCredit,
          depositUser.balance + totalCredit,
        );
      }
    }

    await session.commitTransaction();

    // Gửi SSE notification khi thành công
    const userId = deposit.user.toString();
    const sseType = deposit.type === "purchase" ? "purchase" : "bank";
    const sseMessage = deposit.type === "purchase"
      ? "Thanh toán mua tài khoản thành công!"
      : "Nạp tiền qua ngân hàng thành công!";

    if (hasSSEClient(userId)) {
      sendSSE(userId, "deposit_updated", {
        type: sseType,
        depositId: deposit._id,
        status: "PAID",
        amount: data.amount,
        referenceCode: deposit.referenceCode,
        message: sseMessage,
        timestamp: new Date().toISOString(),
      });
      console.log(`[PayOS Webhook] SSE sent to user ${userId}`);
    }

    res.status(200).json({ code: "00", desc: "Success" });
  } catch (error) {
    await session.abortTransaction();
    console.error("[PayOS Webhook Transaction Error]:", error);
    return res.status(500).json({ code: "99", desc: "Transaction failed" });
  } finally {
    await session.endSession();
  }
});

export const submitCardDeposit = asyncHandler(async (req, res) => {
  const { provider, serial, pin, amount, discountCode } = req.body;
  const userId = req.user.id;

  if (!provider || !serial || !pin || !amount) {
    throw new AppError("Vui lòng cung cấp đầy đủ thông tin thẻ", 400);
  }

  // ── Check trùng + Giftcode bonus ─────────────────────────────────
  const bonus = await applyGiftcodeBonus(discountCode, parseInt(amount));

  let deposit;
  try {
    deposit = await CardDeposit.create({
      user: userId,
      provider: provider.toUpperCase(),
      declaredValue: parseInt(amount),
      serial: serial.toUpperCase().trim(),
      pin: encryptPin(pin.trim()),
      status: "PENDING",
      ...(bonus ? { discount: bonus } : {}),
    });
  } catch (err) {
    // MongoDB duplicate key (unique index on serial+pin for PENDING/SUCCESS)
    if (err.code === 11000) {
      const existingDeposit = await CardDeposit.findOne({
        serial: serial.toUpperCase().trim(),
      }).sort({ createdAt: -1 });
      const msg =
        existingDeposit?.status === "SUCCESS"
          ? "Thẻ này đã được nạp trước đó"
          : "Thẻ đang được xử lý, vui lòng chờ kết quả";
      throw new AppError(msg, 400);
    }
    throw err;
  }

  const cardResult = await chargeCard({ provider, serial, pin, amount });

  deposit.apiRequestId = cardResult.requestId;
  deposit.apiTransId = cardResult.transId;
  deposit.providerResponse = cardResult.raw;
  await deposit.save();

  // Telegram notification (silent fail)
  const depositUser = await User.findById(req.user.id).select("displayName username");
  if (depositUser) {
    notifyNewDeposit(depositUser.displayName || depositUser.username, "card", parseInt(amount));
  }

  res.json({
    success: true,
    message: "Đã gửi yêu cầu. Hệ thống sẽ thông báo khi có kết quả.",
    data: {
      depositId: deposit._id,
      status: "PENDING",
      requestId: cardResult.requestId,
    },
  });
});

export const cardWebhook = asyncHandler(async (req, res) => {
  const body = req.body;

  if (!verifyWebhookSignature(body)) {
    console.warn("[Card Webhook] Invalid signature");
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }

  const parsed = parseWebhookData(body);

  const deposit = await CardDeposit.findOne({
    serial: body.serial?.toUpperCase(),
    $or: [{ apiRequestId: body.request_id }, { apiTransId: body.trans_id }],
  });

  if (!deposit) {
    console.warn("[Card Webhook] Deposit not found:", {
      serial: body.serial,
      request_id: body.request_id,
    });
    return res.status(200).json({ success: true, message: "ignored" });
  }

  // Bỏ qua nếu đã xử lý
  if (deposit.status !== "PENDING") {
    console.log("[Card Webhook] Already processed:", {
      depositId: deposit._id,
      status: deposit.status,
    });
    return res
      .status(200)
      .json({ success: true, message: "already processed" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    deposit.status = parsed.success ? "SUCCESS" : "FAILED";
    deposit.apiStatusCode = parsed.code;
    deposit.apiTransId = parsed.transId;
    deposit.apiRequestId = parsed.requestId;
    deposit.receivedAmount = parsed.receivedAmount;
    deposit.isAmountMismatch = parsed.isAmountMismatch;
    deposit.providerResponse = parsed.raw;
    deposit.message = parsed.message;

    if (parsed.success) {
      const totalCredit = parsed.receivedAmount + (deposit.discount?.amount || 0);
      const updatedUser = await User.findByIdAndUpdate(
        deposit.user,
        { $inc: { balance: totalCredit } },
        { session, new: true, select: "balance displayName username" },
      );

      // ── Audit log ───────────────────────────────────────────────
      if (updatedUser) {
        logBalanceChange({
          userId: deposit.user,
          userName: updatedUser.displayName || updatedUser.username,
          type: "deposit_card",
          amount: totalCredit,
          balanceBefore: updatedUser.balance - totalCredit,
          balanceAfter: updatedUser.balance,
          reference: deposit._id,
          note: `Nạp thẻ ${deposit.provider}${deposit.discount?.code ? ` (giảm: ${deposit.discount.code})` : ""}`,
          ip: req.ip,
        });
      }

      if (deposit.discount?.amount) {
        deposit.bonusAmount = deposit.discount.amount;
      }
    }

    await deposit.save({ session });
    await session.commitTransaction();

    // Telegram notification (silent fail)
    if (parsed.success) {
      const depositUser = await User.findById(deposit.user).select("displayName username balance");
      if (depositUser) {
        notifyDepositSuccess(
          depositUser.displayName || depositUser.username,
          parsed.receivedAmount + (deposit.discount?.amount || 0),
          depositUser.balance + parsed.receivedAmount + (deposit.discount?.amount || 0),
        );
      }
    }

    const userId = deposit.user.toString();
    if (hasSSEClient(userId)) {
      sendSSE(userId, "deposit_updated", {
        type: "card",
        depositId: deposit._id,
        status: deposit.status,
        amount: parsed.receivedAmount,
        declaredValue: parsed.declaredValue,
        isAmountMismatch: parsed.isAmountMismatch,
        provider: deposit.provider,
        message: parsed.message,
        timestamp: new Date().toISOString(),
      });
      console.log(`[Card Webhook] SSE sent to user ${userId}`);
    }

    res.status(200).json({ success: true, message: "processed" });
  } catch (txError) {
    await session.abortTransaction();
    console.error("[Card Webhook Transaction Error]:", txError);
    res
      .status(500)
      .json({ status: "error", message: "internal error" });
  } finally {
    session.endSession();
  }
});

export const calculateFee = asyncHandler(async (req, res) => {
  const { telco, amount } = req.query;

  if (!telco || !amount) {
    throw new AppError("Missing required parameters", 400);
  }

  const result = await getFeeData(telco.toUpperCase(), parseInt(amount));
  res.json(result);
});

export const getActiveBank = asyncHandler(async (req, res) => {
  const banks = await BankAccount.findOne({ isActive: true }).select(
    "-__v -createdAt -updatedAt",
  );
  res.json({
    success: true,
    data: banks
      ? {
          _id: banks._id,
          name: banks.name,
          accountNumber: banks.accountNumber,
          accountName: banks.accountName,
          qrImageUrl: banks.qrImageUrl,
        }
      : null,
  });
});

export const getDepositHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, type = "all" } = req.query; // type: 'bank' | 'card' | 'all'

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const bankQuery =
    type !== "card"
      ? BankDeposit.find({ user: userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate("bank", "name accountNumber")
          .populate("order", "transactionId amount status")
      : Promise.resolve([]);

  const cardQuery =
    type !== "bank"
      ? CardDeposit.find({ user: userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
      : Promise.resolve([]);

  const bankCount =
    type !== "card"
      ? BankDeposit.countDocuments({ user: userId })
      : Promise.resolve(0);

  const cardCount =
    type !== "bank"
      ? CardDeposit.countDocuments({ user: userId })
      : Promise.resolve(0);

  const [bankDeposits, cardDeposits, bankTotal, cardTotal] =
    await Promise.all([bankQuery, cardQuery, bankCount, cardCount]);

  //Format data
  const formatBankDeposit = (doc) => ({
    _id: doc._id,
    type: doc.type === "purchase" ? "purchase" : "bank",
    amount: doc.amount,
    expectedAmount: doc.expectedAmount,
    status: doc.status,
    referenceCode: doc.referenceCode,
    bankName: doc.bank?.name || "Unknown",
    accountNumber: doc.bank?.accountNumber || "N/A",
    createdAt: doc.createdAt,
    paidAt: doc.transactionData?.paidAt || null,
    order: doc.order
      ? {
          transactionId: doc.order.transactionId,
          amount: doc.order.amount,
          status: doc.order.status,
        }
      : null,
  });

  const formatCardDeposit = (doc) => ({
    _id: doc._id,
    type: "card",
    amount: doc.amount,
    declaredValue: doc.declaredValue,
    status: doc.status,
    provider: doc.provider,
    serial: doc.serial
      ? "*".repeat(doc.serial.length - 4) + doc.serial.slice(-4)
      : "****",
    createdAt: doc.createdAt,
    isAmountMismatch: doc.isAmountMismatch,
  });

  let allDeposit = [
    ...bankDeposits.map(formatBankDeposit),
    ...cardDeposits.map(formatCardDeposit),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalItems = bankTotal + cardTotal;
  const paginatedDeposits = allDeposit.slice(0, limitNum);
  const totalPages = Math.ceil(totalItems / limitNum);

  res.json({
    success: true,
    data: {
      deposits: paginatedDeposits,
      totalPages,
      currentPages: pageNum,
      totalItems,
    },
  });
});

// ─────────────────────────────────────────────────────────────────
// PAYOS PURCHASE FLOW (mua trực tiếp qua PayOS QR)
// ─────────────────────────────────────────────────────────────────

/**
 * 1. CREATE PAYOS PURCHASE
 * POST /api/payment/create-purchase
 *
 * 🐛 FIXED: Giftcode usedCount now only increments on PAYMENT CONFIRMATION
 * (in finalizePurchase), not at link creation time.
 *
 * Flow:
 *   1. Atomic reserve account (status: available → reserved)
 *   2. Calculate discount (store for later — don't increment usedCount yet)
 *   3. Create pending Order + BankDeposit in transaction
 *   4. Create PayOS payment link
 *   5. Return QR info
 */
export const createPayOSPurchase = asyncHandler(async (req, res) => {
  const { accountId, discountCode } = req.body;
  const userId = req.user.id;

  if (!accountId) {
    throw new AppError("Thiếu mã tài khoản", 400);
  }

  // ── 1. Atomic reserve ───────────────────────────────────────────
  const account = await reserveAccount(accountId, userId);

  if (!account) {
    throw new AppError(
      "Tài khoản không tồn tại, đã bán hoặc đang có người thanh toán",
      400,
    );
  }

  // ── 2. Tính giá sau giảm (NOT incrementing usedCount yet!) ──────
  let finalAmount = account.price;
  let discountData = null;

  if (discountCode) {
    const giftcode = await Giftcode.findOne({
      code: discountCode.toUpperCase().trim(),
      isDeleted: false,
    });

    if (giftcode && giftcode.isValid) {
      if (account.price >= giftcode.minOrderAmount) {
        const result = calculateDiscount(giftcode, account.price);
        finalAmount = result.finalAmount;
        // 🐛 FIX: usedCount NOT incremented here!
        // It will be incremented in finalizePurchase when payment clears.
        discountData = {
          code: giftcode.code,
          type: giftcode.type,
          value: giftcode.value,
          amount: result.discountAmount,
        };
      }
    }
  }

  // Lấy bank info
  const activeBank = await BankAccount.findOne({ isActive: true });
  if (!activeBank) {
    await releaseAccount(accountId); // Compensate reserve
    throw new AppError("Lỗi khi lấy thông tin ngân hàng", 404);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ── 3. Create pending Order ───────────────────────────────────
    const transactionId = generateId();
    const [order] = await Order.create(
      [
        {
          user: userId,
          account: accountId,
          amount: finalAmount,
          originalPrice: account.price,
          paymentMethod: "payos",
          status: "pending",
          transactionId,
          notes: `Mua tài khoản ${account.title} qua PayOS${discountData ? ` (giảm ${discountData.amount.toLocaleString("vi-VN")}đ)` : ""}`,
          ...(discountData ? { discount: discountData } : {}),
        },
      ],
      { session },
    );

    // ── 4. Create PayOS payment link ────────────────────────────────
    const referenceCode = generateId();
    // Prefix '2' cho purchase để tránh trùng với deposit (prefix '1')
    const orderCode = Number("2" + String(Date.now()).slice(-6));

    const payosBody = {
      orderCode,
      amount: finalAmount,
      description: `Mua acc ${referenceCode.slice(-8)}`,
      returnUrl: `${process.env.FRONTEND_URL}`,
      cancelUrl: `${process.env.FRONTEND_URL}`,
      items: [
        {
          name: `Mua tài khoản ${account.title}`,
          quantity: 1,
          price: finalAmount,
        },
      ],
    };

    const paymentLinkResponse = await payOS.paymentRequests.create(payosBody);

    // ── 5. Create BankDeposit with type "purchase" ─────────────────
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    const [bankDeposit] = await BankDeposit.create(
      [
        {
          type: "purchase",
          order: order._id,
          user: userId,
          bank: activeBank._id,
          referenceCode,
          expectedAmount: finalAmount,
          status: "PENDING",
          payosOrderId: paymentLinkResponse.id,
          orderCode,
          amount: 0,
          reservedAt: new Date(),
          expiresAt,
          ...(discountData ? { discount: discountData } : {}),
        },
      ],
      { session },
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Đã tạo đơn hàng PayOS. Vui lòng chuyển khoản để thanh toán.",
      data: {
        bankDepositId: bankDeposit._id,
        orderId: order._id,
        transactionId: order.transactionId,
        qrImage: paymentLinkResponse.qrCode,
        accountName: paymentLinkResponse.accountName,
        accountNumber: paymentLinkResponse.accountNumber,
        bankName: activeBank.name,
        referenceCode,
        amount: finalAmount,
        originalPrice: account.price,
        discount: discountData,
        expiresAt: expiresAt.toISOString(),
        accountTitle: account.title,
        instruction: `Chuyển khoản số tiền ${finalAmount.toLocaleString("vi-VN")}đ với nội dung: ${referenceCode}`,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    // Compensate: release reserve if transaction failed
    await releaseAccount(accountId);
    throw error;
  } finally {
    session.endSession();
  }
});
/**
 * 2. CHECK PURCHASE STATUS
 * POST /api/payment/purchase/:bankDepositId/check
 *
 * Manually verify payment status with PayOS.
 * Uses finalizePurchase for consistency with webhook path.
 */
export const checkPayOSPurchaseStatus = asyncHandler(async (req, res) => {
  const { bankDepositId } = req.params;
  const userId = req.user.id;

  const deposit = await BankDeposit.findOne({
    _id: bankDepositId,
    user: userId,
    type: "purchase",
  }).populate("order");

  if (!deposit) {
    throw new AppError("Giao dịch không tồn tại", 404);
  }

  // Đã xử lý thành công rồi
  if (deposit.status === "PAID") {
    return res.json({
      success: true,
      data: {
        status: "PAID",
        message: "Giao dịch đã được xác nhận thành công.",
        order: deposit.order,
      },
    });
  }

  // Đã huỷ
  if (deposit.status === "CANCELLED" || deposit.status === "FAILED") {
    return res.json({
      success: true,
      data: {
        status: deposit.status,
        message: "Giao dịch đã bị huỷ hoặc thất bại.",
      },
    });
  }

  // Kiểm tra qua PayOS API
  if (deposit.payosOrderId) {
    try {
      const paymentInfo = await payOS.getPaymentLinkInformation(deposit.payosOrderId);
      console.log("[PayOS Check] Payment info:", paymentInfo);

      if (paymentInfo.status === "PAID") {
        // Use the same finalizer as webhook
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const transactionData = {
            orderCode: deposit.orderCode,
            amount: deposit.expectedAmount,
            paidAt: paymentInfo.transactions?.[0]?.transactionDateTime,
          };

          await finalizePurchase(deposit, { ...paymentInfo, ...transactionData }, session);

          // Increment giftcode usedCount now (payment confirmed)
          if (deposit.discount?.code) {
            const giftcode = await Giftcode.findOne({
              code: deposit.discount.code,
              isDeleted: false,
            }).session(session);
            if (giftcode) {
              giftcode.usedCount += 1;
              await giftcode.save({ session });
            }
          }

          await session.commitTransaction();
        } catch (txError) {
          await session.abortTransaction();
          throw txError;
        } finally {
          session.endSession();
        }

        return res.json({
          success: true,
          data: {
            status: "PAID",
            message: "Thanh toán đã được xác nhận!",
            order: deposit.order,
          },
        });
      }

      if (paymentInfo.status === "CANCELLED") {
        // Use cancelPurchase service
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          await cancelPurchase(deposit, "Thanh toán bị huỷ", session);
          await session.commitTransaction();
        } catch (txError) {
          await session.abortTransaction();
          throw txError;
        } finally {
          session.endSession();
        }

        return res.json({
          success: true,
          data: {
            status: "CANCELLED",
            message: "Giao dịch đã bị huỷ.",
          },
        });
      }
    } catch (payosError) {
      console.warn("[PayOS Check] API error:", payosError.message);
    }
  }

  // Còn chờ xử lý
  res.json({
    success: true,
    data: {
      status: "PENDING",
      message: "Giao dịch đang chờ thanh toán.",
      expiresAt: deposit.expiresAt,
    },
  });
});

/**
 * 3. CANCEL PURCHASE
 * POST /api/payment/purchase/:bankDepositId/cancel
 * Cancel a pending purchase, release account
 */
export const cancelPayOSPurchase = asyncHandler(async (req, res) => {
  const { bankDepositId } = req.params;
  const userId = req.user.id;

  const deposit = await BankDeposit.findOne({
    _id: bankDepositId,
    user: userId,
    type: "purchase",
    status: "PENDING",
  }).populate("order");

  if (!deposit) {
    throw new AppError("Giao dịch không tồn tại hoặc đã xử lý", 404);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await cancelPurchase(deposit, "Huỷ bởi người dùng", session);
    await session.commitTransaction();

    res.json({
      success: true,
      message: "Đã huỷ giao dịch.",
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

