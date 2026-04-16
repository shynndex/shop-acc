import mongoose from "mongoose";

const bankAccountSchema = new mongoose.Schema(
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

bankAccountSchema.pre("save", async function (next) {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } },
    );
  }
  next();
});

const BankAccount = mongoose.model("BankAccount", bankAccountSchema);
export default BankAccount;
