import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Chỉ cho review 1 lần / 1 order
reviewSchema.index({ order: 1 }, { unique: true });
reviewSchema.index({ account: 1, status: 1 });
reviewSchema.index({ user: 1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
