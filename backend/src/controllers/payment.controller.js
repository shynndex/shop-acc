import mongoose from "mongoose";
import { generateId } from "../libs/generateId.js";
import payOS from "../libs/payos.config.js";
import BankAccount from "../models/admin/BankAccount.js";
import BankDeposit from "../models/BankDeposit.model.js";
import User from "../models/client/User.model.js";
import {
  chargeCard,
  getFeeData,
  md5,
  parseWebhookData,
  verifyWebhookSignature,
} from "../services/cardProvider.service.js";
import CardDeposit from "../models/CardDeposit.model.js";
import { hasSSEClient, sendSSE } from "../utils/sse.js";

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
      status: "PENDING",
      payosOrderId: paymentLinkResponse.id, // ID giao dịch bên PayOS
      orderCode,
      amount: 0,
      status: "PENDING",
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

    if (data.amount !== deposit.amount) {
      console.warn(
        `Amount mismatch: Expected ${deposit.amount}, Got ${data.amount}`,
      );
      deposit.status = "FAILED";
      await deposit.save();
      return res.status(400).json({ code: "99", desc: "Amount mismatch" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      deposit.status = "PAID";
      deposit.transactionData = data;
      await deposit.save({ session });

      await User.findByIdAndUpdate(
        deposit.user,
        { $inc: { balance: deposit.amount } },
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
      pin: pin.trim(),
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
      pin: pin.trim(),
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
        .json({ status: "error", message: "Invalid signature" });
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
      return res.status(200).json({ status: "success", message: "ignored" });
    }

    // Bỏ qua nếu đã xử lý
    if (deposit.status !== "PENDING") {
      console.log("[Card Webhook] Already processed:", {
        depositId: deposit._id,
        status: deposit.status,
      });
      return res
        .status(200)
        .json({ status: "success", message: "already processed" });
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

      return res.status(200).json({ status: "success", message: "processed" });
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
