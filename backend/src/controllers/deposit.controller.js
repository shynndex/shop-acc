import mongoose from "mongoose";
import { generateId } from "../libs/generateId.js";
import payOS from "../libs/payos.config.js";
import BankAccount from "../models/admin/BankAccount.js";
import Deposit from "../models/Deposit.model.js";
import User from "../models/client/User.model.js";

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

    await Deposit.create({
      user: req.user.id,
      bank: activeBank._id, // Lưu bank nào đang xử lý
      referenceCode,
      status: "PENDING",
      payosOrderId: paymentLinkResponse.id, // ID giao dịch bên PayOS
      orderCode,
      amount: parseInt(amount),
      status: "PENDING",
    });

    res.json({
      success: true,
      data: {
        qrImage: activeBank.qrImageUrl,
        accountName: activeBank.accountName,
        accountNumber: activeBank.accountNumber,
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
    const deposit = await Deposit.findOne({
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
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error("Error in payosWebhook:", error);
    res.status(500).json({ code: "99", desc: "Internal server error" });
  }
};
