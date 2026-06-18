import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../../.env") });

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "super_admin"], default: "admin" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

const Admin = mongoose.model("Admin", adminSchema);

async function createAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not found in .env file");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }

  const existing = await Admin.findOne({
    $or: [{ email: "admin@example.com" }, { username: "admin" }],
  });

  if (existing) {
    console.log("ℹ️  Admin account already exists:");
    console.log(`   Username: ${existing.username}`);
    console.log(`   Email: ${existing.email}`);
    console.log(`   Role: ${existing.role}`);
    console.log(`   Active: ${existing.isActive}`);
    await mongoose.disconnect();
    return;
  }

  const admin = await Admin.create({
    username: "admin",
    email: "admin@example.com",
    password: "admin123",
    role: "super_admin",
  });

  console.log("✅ Admin account created successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Username: admin`);
  console.log(`   Email: admin@example.com`);
  console.log(`   Password: admin123`);
  console.log(`   Role: super_admin`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⚠️  Please change the password after first login!");

  await mongoose.disconnect();
}

createAdmin();
