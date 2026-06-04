import mongoose from "mongoose";

const BankAccountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // "MB Bank", "Vietcombank"
    accountNumber: { type: String, required: true, unique: true },
    accountName: { type: String, required: true, trim: true },
    qrImageUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

BankAccountSchema.pre("save", async function () {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { $set: { isActive: false } },
    );
  }
});

BankAccountSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const BankAccount = mongoose.model("BankAccount", BankAccountSchema);
export default BankAccount;
