import mongoose from "mongoose";
import Admin from "../models/admin/Admin.model.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const [,, email, newPassword] = process.argv;

const DEFAULT_EMAIL = "admin@system.local";
const DEFAULT_PASSWORD = "Admin@Secure123";

const reset = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const targetEmail = email || DEFAULT_EMAIL;
    const targetPassword = newPassword || DEFAULT_PASSWORD;

    const admin = await Admin.findOne({ email: targetEmail }).select("+password");
    if (!admin) {
      console.log(`Không tìm thấy admin với email: ${targetEmail}`);
      process.exit(1);
    }

    const currentHash = admin.password;
    const isBcrypt = currentHash && (currentHash.startsWith("$2a$") || currentHash.startsWith("$2b$") || currentHash.startsWith("$2y$"));

    if (isBcrypt) {
      const match = await bcrypt.compare(targetPassword, currentHash);
      if (match) {
        console.log(`✅ Mật khẩu hiện tại ĐÚNG cho admin "${admin.username}" (${targetEmail})`);
      } else {
        console.log(`❌ Mật khẩu hiện tại SAI cho admin "${admin.username}" (${targetEmail})`);
        console.log(`→ Đang reset thành: ${targetPassword}`);
        admin.password = targetPassword;
        await admin.save();
        console.log(`✅ Đã reset mật khẩu thành công!`);
      }
    } else {
      console.log(`⚠️  Mật khẩu hiện tại KHÔNG phải bcrypt hash (plaintext?): "${currentHash}"`);
      console.log(`→ Đang hash và lưu lại...`);
      const hashed = await bcrypt.hash(targetPassword, 12);
      admin.password = hashed;
      await admin.save();
      console.log(`✅ Đã hash và lưu mật khẩu thành công!`);
    }

    console.log(`\nThông tin admin:`);
    console.log(`  Email: ${targetEmail}`);
    console.log(`  Password: ${targetPassword}`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Active: ${admin.isActive}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error("Lỗi:", e);
    process.exit(1);
  }
};

reset();
