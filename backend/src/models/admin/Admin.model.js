import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "super_admin"], default: "admin" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    loginIP: { type: String },

    // ── Brute-force protection (ẩn khỏi API mặc định) ──────────────────────
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockoutUntil: { type: Date, default: null, select: false },

    // ── Refresh Token Rotation ────────────────────────────────────────────
    refreshToken: { type: String, default: null, select: false },
    /** Tokens that have been rotated — if reused, indicates theft */
    refreshTokenUsed: [{ type: String, select: false }],

    // ── 2FA / TOTP ────────────────────────────────────────────────────────
    totpSecret: { type: String, default: null, select: false },
    totpEnabled: { type: Boolean, default: false },
    totpVerifiedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

adminSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
