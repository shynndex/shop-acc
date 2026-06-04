/**
 * ShopAccLQ — Seed Admin Account
 *
 * Creates a test admin account in MongoDB.
 *
 * Usage:
 *   node script/seedAdmin.js
 *   npm run seed:admin
 *
 * Default credentials:
 *   Email:    admin@shopacclq.com
 *   Password: admin123
 *   Username: admin
 *   Role:     super_admin
 */

import "dotenv/config";
import mongoose from "mongoose";
import Admin from "../src/models/admin/Admin.model.js";

const ADMIN = {
  username: process.env.SEED_ADMIN_USERNAME || "admin",
  email: process.env.SEED_ADMIN_EMAIL || "admin@shopacclq.com",
  password: process.env.SEED_ADMIN_PASSWORD || "admin123",
  role: process.env.SEED_ADMIN_ROLE || "super_admin",
};

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not set in .env");
    process.exit(1);
  }

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log("✅ Connected\n");

  try {
    // Check if admin already exists
    const existing = await Admin.findOne({
      $or: [{ email: ADMIN.email }, { username: ADMIN.username }],
    });

    if (existing) {
      console.log(`ℹ️  Admin already exists:`);
      console.log(`   Username: ${existing.username}`);
      console.log(`   Email:    ${existing.email}`);
      console.log(`   Role:     ${existing.role}`);
      console.log(`   Active:   ${existing.isActive}`);
      console.log(`\n   To reset password, delete the account first.`);
    } else {
      const admin = await Admin.create({
        username: ADMIN.username,
        email: ADMIN.email,
        password: ADMIN.password,
        role: ADMIN.role,
        isActive: true,
      });

      console.log(`✅ Admin account created:`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Email:    ${admin.email}`);
      console.log(`   Password: ${ADMIN.password}`);
      console.log(`   Role:     ${admin.role}`);
      console.log(`   ID:       ${admin._id}`);
    }
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected. Done.");
  }
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
