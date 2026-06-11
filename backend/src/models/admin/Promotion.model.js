import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: false },
    minDepositAmount: { type: Number, default: 100000, min: 0 },
    rewardType: {
      type: String,
      enum: ["balance_bonus", "random_spin"],
      required: true,
    },
    rewardAmount: { type: Number, default: 0, min: 0 },
    rewardSpins: { type: Number, default: 1, min: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Check if promotion is currently valid
promotionSchema.methods.isCurrentlyValid = function () {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
};

// Check if user has already claimed this promotion
promotionSchema.methods.hasUserClaimed = function (userId) {
  return this.usedBy.some((id) => id.toString() === userId.toString());
};

const Promotion = mongoose.model("Promotion", promotionSchema);

export default Promotion;
