import mongoose from "mongoose";

const BankDepositSchema = new mongoose.Schema(
  {
    // Loại giao dịch: "deposit" ( tiền) | "purchase" (mua trực tiếp qua PayOS)
    type: {
      type: String,
      enum: ["deposit", "purchase"],
      default: "deposit",
      index: true,
    },
    // Order liên quan (nếu type === "purchase")
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      required: true,
    },
    // Mã định danh phụ trợ (tùy chọn, dùng cho admin tìm kiếm,User điền vào nội dung chuyển khoản)  Ví dụ: SAM1A2B3C
    referenceCode: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    //   Mã đơn hàng nội bộ (Dùng để khớp với PayOS)
    //  PayOS yêu cầu field này phải là Số (Number) và duy nhất
    orderCode: { type: Number, required: true, unique: true, index: true },
    expectedAmount: { type: Number, default: 0 }, // Số tiền nhập vào từ frontend
    // Số tiền thực tế user nhận được
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    // Mã giao dịch gốc từ PayOS (Dùng để tra cứu trên dashboard PayOS)
    payosOrderId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      default: "",
    },
    transactionData: {
      type: mongoose.Schema.Types.Mixed,
    },

    // Thông tin giảm giá nếu có
    discount: {
      code: { type: String, default: null },
      type: { type: String, enum: ["percent", "fixed", null], default: null },
      value: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },

    // Số tiền bonus từ giftcode (lưu riêng để dễ query)
    bonusAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Reserve info (cho type === "purchase")
    reservedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null }, // 15 phút sau reservedAt

    // ── Optimistic locking ─────────────────────────────────────────
    // Incremented on every status-changing write.
    // Used for CAS (Compare-And-Swap) in finalizePurchase et al.
    version: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

BankDepositSchema.index({ status: 1, createdAt: -1 });

const BankDeposit = mongoose.model("BankDeposit", BankDepositSchema);
export default BankDeposit;
