import mongoose from "mongoose";
import { generateId } from "../utils/generateId.js";
import payOS from "../libs/payos.config.js";
import User from "../models/client/User.model.js";
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

export const createDepositInfo = async (req, res) => {
  try {
    const activeBank = await BankAccount.findOne({ isActive: true });
    const { amount } = req.body;

    if (!amount || amount < 10000) {
      return res.status(400).json({
        success: false,
        message: "Số tiền nạp phải lớn hơn hoặc bằng 10,000 VND",
      });
    }

    if (!activeBank) {
      return res.status(404).json({
        success: false,
        message: "Lỗi khi lấy ngân hàng ở getDepositInfo",
      });
    }

    const referenceCode = generateId();

    // Mã đơn hàng nội bộ (PayOS yêu cầu là số, duy nhất)
    const orderCode = Number(String(Date.now()).slice(-6));

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

    await BankDeposit.create({
      user: req.user.id,
      bank: activeBank._id, // Lưu bank nào đang xử lý
      referenceCode,
      expectedAmount: parseInt(amount),
      status: "PENDING",
      payosOrderId: paymentLinkResponse.id, // ID giao dịch bên PayOS
      orderCode,
      amount: 0,
    });

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
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo đơn nạp tiền getDepositInfo",
    });
  }
};

export const payosWebhook = async (req, res) => {
  try {
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
      deposit.status = "PAID";
      deposit.amount = data.amount;
      deposit.transactionData = data;
      await deposit.save({ session });

      await User.findByIdAndUpdate(
        deposit.user,
        { $inc: { balance: data.amount } },
        { session },
      );

      await session.commitTransaction();

      // Gửi SSE notification khi thành công
      const userId = deposit.user.toString();
      if (hasSSEClient(userId)) {
        sendSSE(userId, "deposit_updated", {
          type: "bank",
          depositId: deposit._id,
          status: "PAID",
          amount: data.amount,
          referenceCode: deposit.referenceCode,
          message: "Nạp tiền qua ngân hàng thành công!",
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
  } catch (error) {
    console.error("Error in payosWebhook:", error);
    res.status(500).json({ code: "99", desc: "Internal server error" });
  }
};

export const submitCardDeposit = async (req, res) => {
  try {
    const { provider, serial, pin, amount } = req.body;
    const userId = req.user.id;

    if (!provider || !serial || !pin || !amount) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin thẻ",
      });
    }

    const existing = await CardDeposit.findOne({
      serial: serial.toUpperCase().trim(),
      pin: encryptPin(pin.trim()),
      status: { $in: ["PENDING", "SUCCESS"] },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          existing.status === "SUCCESS"
            ? "Thẻ này đã được nạp trước đó"
            : "Thẻ đang được xử lý, vui lòng chờ kết quả",
      });
    }

    const deposit = await CardDeposit.create({
      user: userId,
      provider: provider.toUpperCase(),
      declaredValue: parseInt(amount),
      serial: serial.toUpperCase().trim(),
      pin: encryptPin(pin.trim()),
      status: "PENDING",
    });

    const cardResult = await chargeCard({ provider, serial, pin, amount });

    deposit.apiRequestId = cardResult.requestId;
    deposit.apiTransId = cardResult.transId;
    deposit.providerResponse = cardResult.raw;
    await deposit.save();

    return res.json({
      success: true,
      message: "Đã gửi yêu cầu. Hệ thống sẽ thông báo khi có kết quả.",
      data: {
        depositId: deposit._id,
        status: "PENDING",
        requestId: cardResult.requestId,
      },
    });
  } catch (error) {
    console.error("Error in submitCardDeposit:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xử lý nạp tiền bằng thẻ",
    });
  }
};

export const cardWebhook = async (req, res) => {
  try {
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
        await User.findByIdAndUpdate(
          deposit.user,
          { $inc: { balance: parsed.receivedAmount } },
          { session },
        );
      }

      await deposit.save({ session });
      await session.commitTransaction();

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

      return res.status(200).json({ success: true, message: "processed" });
    } catch (txError) {
      await session.abortTransaction();
      console.error("[Card Webhook Transaction Error]:", txError);
      return res
        .status(500)
        .json({ status: "error", message: "internal error" });
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("[Card Webhook] Critical Error:", error);
    return res.status(500).json({ status: "error", message: "server error" });
  }
};

export const calculateFee = async (req, res) => {
  try {
    const { telco, amount } = req.query;

    if (!telco || !amount) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing required parameters" });
    }

    const result = await getFeeData(telco.toUpperCase(), parseInt(amount));
    return res.json(result);
  } catch (error) {
    console.error("[Calculate Fee] Error:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
};

export const getActiveBank = async (req, res) => {
  try {
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
            accountName: bank.accountName,
            qrImageUrl: bank.qrImageUrl,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "Lỗi khi lấy thông tin ngân hàng hoạt động getActiveBank:",
      error,
    );
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

export const getDepositHistory = async (req, res) => {
  try {
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
      type: "bank",
      amount: doc.amount,
      expectedAmount: doc.expectedAmount,
      status: doc.status,
      referenceCode: doc.referenceCode,
      bankName: doc.bank?.name || "Unknown",
      accountNumber: doc.bank?.accountNumber || "N/A",
      createdAt: doc.createdAt,
      paidAt: doc.transactionData?.paidAt || null,
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
      ...bankDeposits.map(formatBankDeposit), // cách rút gọn
      ...cardDeposits.map(formatCardDeposit),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalItems = bankTotal + cardTotal;
    const paginatedDeposits = allDeposit.slice(0, limitNum);
    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      success:true,
      data: {
        deposits:paginatedDeposits,
        totalPages,
        currentPages:pageNum,
        totalItems,
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử nạp tiền getDepositHistory:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};
