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

    // Rating từ reviews (cập nhật tự động)
    rating: {
      type: {
        avg: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
      },
      default: { avg: 0, count: 0 },
    },

    //THÔNG TIN NHẠY CẢM (Ẩn mặc định khỏi public API, chỉ admin select +loginInfo)
    loginInfo: {
      type: {
        username: { type: String, required: true },
        password: { type: String, required: true },
      },
      select: false,
      required: true,
    },

    // === State Machine: status là source of truth ===
    status: {
      type: String,
      enum: ["available", "reserved", "sold", "inactive"],
      default: "available",
      index: true,
    },
    // Boolean fields for backward compatibility (synced by pre-save hook)
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isSold: {
      type: Boolean,
      default: false,
      index: true,
    },
    isReserved: {
      type: Boolean,
      default: false,
      index: true,
    },
    soldTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    soldAt: {
      type: Date,
      default: null,
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reservedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// ─── Pre-save hook: sync status ↔ booleans ─────────────────────────────────
accountSchema.pre("save", function () {
  if (this.isModified("status")) {
    // status is source of truth → sync booleans
    switch (this.status) {
      case "available":
        this.isActive = true;
        this.isSold = false;
        this.isReserved = false;
        break;
      case "reserved":
        this.isActive = true;
        this.isSold = false;
        this.isReserved = true;
        break;
      case "sold":
        this.isActive = true;
        this.isSold = true;
        this.isReserved = false;
        break;
      case "inactive":
        this.isActive = false;
        this.isSold = false;
        this.isReserved = false;
        break;
    }
  } else if (this.isModified("isSold") || this.isModified("isReserved") || this.isModified("isActive")) {
    // Booleans changed (old code) → derive status
    if (this.isSold) this.status = "sold";
    else if (this.isReserved) this.status = "reserved";
    else if (!this.isActive) this.status = "inactive";
    else this.status = "available";
  }
});

// ─── Statics: atomic reserve/release helpers ───────────────────────────────
accountSchema.statics.atomicReserve = function (accountId, userId) {
  return this.findOneAndUpdate(
    {
      _id: accountId,
      status: "available",
    },
    {
      $set: {
        status: "reserved",
        isReserved: true,
        reservedBy: userId,
        reservedAt: new Date(),
      },
    },
    { new: true },
  );
};

accountSchema.statics.atomicRelease = function (accountId) {
  return this.findOneAndUpdate(
    {
      _id: accountId,
      status: "reserved",
    },
    {
      $set: {
        status: "available",
        isReserved: false,
        reservedBy: null,
        reservedAt: null,
      },
    },
    { new: true },
  );
};

accountSchema.statics.atomicSell = function (accountId, userId, session) {
  const opts = session ? { session, new: true } : { new: true };
  return this.findOneAndUpdate(
    {
      _id: accountId,
      status: { $in: ["available", "reserved"] },
    },
    {
      $set: {
        status: "sold",
        isSold: true,
        isReserved: false,
        soldTo: userId,
        soldAt: new Date(),
      },
    },
    opts,
  );
};

// Chuyển _id -> id, ẩn __v. GIỮ LẠI _id để admin frontend không bị lỗi.
// KHÔNG xóa loginInfo ở đây vì admin cần xem qua .select("+loginInfo")
accountSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

// Tương tự cho toObject
accountSchema.set("toObject", {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

accountSchema.index({ game: 1, status: 1 });
accountSchema.index({ price: 1 });
accountSchema.index({ createdAt: -1 });
accountSchema.index({ status: 1, reservedAt: 1 }); // For sweeper

const Account = mongoose.model("Account", accountSchema);
export default Account;
