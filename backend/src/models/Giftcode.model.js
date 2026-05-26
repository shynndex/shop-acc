import mongoose from "mongoose";

const giftcodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["percent", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxUses: {
      type: Number,
      default: null, // null = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    gameFilter: {
      type: String,
      default: null, // null = all games
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

giftcodeSchema.virtual("isValid").get(function () {
  if (!this.isActive || this.isDeleted) return false;
  if (this.maxUses !== null && this.usedCount >= this.maxUses) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
});

giftcodeSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

const Giftcode = mongoose.model("Giftcode", giftcodeSchema);
export default Giftcode;
