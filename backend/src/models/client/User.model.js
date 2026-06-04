import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: true,
      select: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
    avatarId: {
      type: String,
    },
    phone: {
      type: String,
      sparse: true, // Cho phép null nhưng không được trùng
    },
    balance: { type: Number, default: 0 }, // Ví dụ: số dư ví
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },

    // ── Password reset ───────────────────────────────────────────
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // ── Brute-force protection (ẩn khỏi API mặc định) ──────────────────────
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockoutUntil: { type: Date, default: null, select: false },
  },
  {
    timestamps: true,
  },
);

// Tự động đổi _id → id khi trả JSON
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString(); // Chuyển ObjectId → string
    delete ret._id; // Xóa _id để tránh lộ cấu trúc DB
    delete ret.hashedPassword; // Luôn ẩn password
    return ret;
  },
});

//Tương tự cho toObject (dùng khi query .lean())
userSchema.set("toObject", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.hashedPassword;
    return ret;
  },
});

// userSchema.virtual("password").set(function (val) {
//   this._plainPassword = val;
// });

// userSchema.pre("save", async function () {
//   try {
//     // Nếu input là field 'password' (virtual), chuyển sang 'hashedPassword'
//     if (this.isNew || this.isModified("_plainPassword")) {
//       this.password = await bcrypt.hash(this._plainPassword, 12);
//       this._plainPassword = undefined;
//     }
//   } catch (error) {
//     throw error;
//   }
// });

// Instance method: So sánh password khi login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.hashedPassword);
};

const User = mongoose.model("User", userSchema);
export default User;
