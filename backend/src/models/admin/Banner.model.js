import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    imageDesktopUrl: { type: String, required: true },
    imageMobileUrl: { type: String, default: "" },
    headline: { type: String, default: "" },
    description: { type: String, default: "" },
    ctaText: { type: String, default: "" },
    ctaLink: { type: String, default: "" },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

BannerSchema.index({ isActive: 1, sortOrder: 1 });
BannerSchema.index({ startDate: 1, endDate: 1 });

BannerSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

const Banner = mongoose.model("Banner", BannerSchema);
export default Banner;
