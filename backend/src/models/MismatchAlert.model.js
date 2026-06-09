import mongoose from "mongoose";

const mismatchAlertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "order_amount_mismatch",
        "order_status_mismatch",
        "orphan_deposit",
        "serial_pin_duplicate",
        "bank_amount_mismatch",
        "abnormal_deposit",
        "abnormal_pending",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["warning", "critical"],
      required: true,
    },
    deposit: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "depositModel",
    },
    depositModel: {
      type: String,
      enum: ["BankDeposit", "CardDeposit"],
      default: "BankDeposit",
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    message: { type: String, required: true },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
      index: true,
    },
    resolvedAt: { type: Date, default: null },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true },
);

// Indexes for fast queries
mismatchAlertSchema.index({ status: 1, createdAt: -1 });
mismatchAlertSchema.index({ type: 1, status: 1 });
mismatchAlertSchema.index({ user: 1, status: 1 });

const MismatchAlert = mongoose.model("MismatchAlert", mismatchAlertSchema);
export default MismatchAlert;
