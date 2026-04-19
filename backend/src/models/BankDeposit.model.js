import mongoose from "mongoose";

const BankDepositSchema = new mongoose.Schema(
  {
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
    transactionData: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

const BankDeposit = mongoose.model("BankDeposit", BankDepositSchema);
export default BankDeposit;
