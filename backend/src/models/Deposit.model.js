import mongoose from "mongoose";

const depositSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      required: true,
    },
    // Mã định danh phụ trợ (tùy chọn, dùng cho admin tìm kiếm)
    referenceCode: { type: String, required: true, index: true },
    // Mã đơn hàng nội bộ
    orderCode: { type: Number, required: true, unique: true, index: true },
    amount: { type: Number, default: 0 }, // Số tiền thực tế
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    transactionData: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

const Deposit = mongoose.model("Deposit", depositSchema);
export default Deposit;
