import mongoose from "mongoose";

const CardDepositSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: {
      type: String,
      required: true,
      enum: ["VIETTEL", "MOBI", "VINA", "VNMOBILE"],
      uppercase: true,
      trim: true,
    },
    serial: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true, // Giúp kiểm tra trùng thẻ nhanh
    },
    pin: {
      type: String,
      required: true,
      trim: true,
      // Production: Nên hash hoặc encrypt field này trước khi lưu
    },
    declaredValue: {
      type: Number,
      required: true,
      min: 0,
    }, // Số tiền user khai báo
    receivedAmount: {
      type: Number,
      default: 0,
      min: 0,
    }, // Số tiền THỰC NHẬN (đã trừ chiết khấu)
    isAmountMismatch: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
      index: true,
    },
    apiStatusCode: {
      type: Number, // 1, 2, 3, 4, 99, 100
      index: true,
    },
    apiTransId: {
      type: Number,
      unique: true,
      sparse: true,
    },
    apiRequestId: {
      type: String,
      index: true,
    },
    // Response gốc từ api
    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    adminNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual: Format ngày giờ tiếng Việt
CardDepositSchema.virtual("formattedDate").get(function () {
  return this.createdAt?.toLocaleString("vi-VN");
});

cardDepositSchema.index({ user: 1, status: 1, createdAt: -1 });

//  Index chống trùng thẻ đang xử lý hoặc đã thành công
cardDepositSchema.index(
  { serial: 1, pin: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["PENDING", "SUCCESS"] } },
  },
);

const CardDeposit = mongoose.model("CardDeposit", CardDepositSchema);
export default CardDeposit;
