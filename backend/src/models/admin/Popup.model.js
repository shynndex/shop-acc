import mongoose from "mongoose";

const PopupSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["notification", "promotion"],
      required: true,
    },
    content: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    imageMobileUrl: { type: String, default: "" },
    ctaText: { type: String, default: "" },
    ctaLink: { type: String, default: "" },
    displayPages: [
      {
        type: String,
        enum: [
          "home",
          "shop",
          "compare",
          "account-detail",
          "order-history",
          "profile",
          "all",
        ],
      },
    ],
    triggerType: {
      type: String,
      enum: ["timeout", "click"],
      default: "timeout",
    },
    triggerDelay: { type: Number, default: 5 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

PopupSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
PopupSchema.index({ displayPages: 1 });

PopupSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

const Popup = mongoose.model("Popup", PopupSchema);
export default Popup;
