import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    game: {
      type: String,
      required: true,
      enum: ["lien-quan", "lien-minh", "valorant", "free-fire", "khac"], // Dễ mở rộng
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    // Thông tin chi tiết hiển thị cho khách (Rank, Skin, Tướng...)
    attributes: {
      type: mongoose.Schema.Types.Mixed, // Flexible data
      default: {},
    },
    images: [String],
    type: { type: String, default: "standard" }, // "trang", "reg", "random", "vip"...
    status: {
      type: String,
      enum: ["available", "sold", "reserved"],
      default: "available",
    },
    //THÔNG TIN NHẠY CẢM (Ẩn khỏi public API)
    loginInfo: {
      username: { type: String, required: true },
      password: { type: String, required: true },
      server: { type: String },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Nếu sau này làm marketplace (user bán cho user)
    },
  },
  { timestamps: true },
);

// Ẩn loginInfo khi query thông thường
accountSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret.loginInfo;
    delete ret.__v;
    return ret;
  },
});

const Account = mongoose.model("Account", accountSchema);
export default Account;
