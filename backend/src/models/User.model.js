import mongoose from "mongoose";

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
    bio: {
      type: String,
      maxlength: 500,
    },
    phone: {
      type: String,
      sparse: true, // Cho phép null nhưng không được trùng
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  // Chỉ hash nếu password được sửa đổi hoặc là document mớ
  if (!this.isModified("hashedPassword") && !this.isNew) return next();
  try {
    // Nếu input là field 'password' (virtual), chuyển sang 'hashedPassword'
    if (this.password) {
      this.hashedPassword = await bcrypt.hash(this.password, 12);
      this.password = undefined;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method: So sánh password khi login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.hashedPassword);
};

const User = mongoose.model("User", userSchema);
export default User;
