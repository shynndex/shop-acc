import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },
    // Số tiền thực tế thanh toán (sau giảm giá nếu có)
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Giá gốc của sản phẩm (trước giảm giá)
    originalPrice: {
      type: Number,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["balance", "bank", "card", "payos"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
      index: true,
    },

    transactionId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    notes: { type: String, trim: true },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledReason: { type: String, default: "" },

    // Thông tin giảm giá nếu có
    discount: {
      code: { type: String, default: null },
      type: { type: String, enum: ["percent", "fixed", null], default: null },
      value: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

orderSchema.virtual("accountDetails", {
  ref: "Account",
  localField: "account",
  foreignField: "_id",
  justOne: true,
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ account: 1, status: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
