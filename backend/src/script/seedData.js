import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

// ─── Models ────────────────────────────────────────────────────────────────

import Account from "../models/Account.model.js";
import User from "../models/client/User.model.js";
import Order from "../models/Order.model.js";

// ─── Seed Data ──────────────────────────────────────────────────────────────

const USERS = [
  {
    username: "testuser",
    email: "test@example.com",
    password: "123456",
    displayName: "Nguyễn Văn A",
    balance: 5000000,
    isVerified: true,
  },
  {
    username: "admin",
    email: "admin@example.com",
    password: "admin123",
    displayName: "Admin",
    balance: 0,
    isVerified: true,
  },
];

const ACCOUNTS = [
  // ─── Liên Quân — Nick Trang ──────────────────────────────────────────
  {
    title: "Acc Liên Quân - Thông Tin Đẹp #01",
    game: "lien-quan",
    type: "trang",
    price: 150000,
    description: "Acc thông tin đẹp, nhiều skin, rank cao",
    attributes: {
      rank: "Kim Cương",
      skinCount: 45,
      heroCount: 68,
      level: 30,
      code: "LQ-TD001",
      originalPrice: 200000,
      discount: 25,
    },
    images: ["https://picsum.photos/seed/lq1/400/300"],
    loginInfo: { username: "acc_lq_01", password: "pass123" },
    isActive: true,
    isSold: false,
  },
  {
    title: "Acc Liên Quân - Siêu Phẩm #02",
    game: "lien-quan",
    type: "trang",
    price: 280000,
    description: "Acc siêu phẩm với nhiều skin giới hạn",
    attributes: {
      rank: "Cao Thủ",
      skinCount: 120,
      heroCount: 90,
      level: 30,
      code: "LQ-TD002",
      originalPrice: 350000,
      discount: 20,
    },
    images: ["https://picsum.photos/seed/lq2/400/300"],
    loginInfo: { username: "acc_lq_02", password: "pass123" },
    isActive: true,
    isSold: false,
  },
  {
    title: "Acc Liên Quân - Reg Trắng #03",
    game: "lien-quan",
    type: "reg",
    price: 35000,
    description: "Acc reg trắng, chưa qua sử dụng",
    attributes: {
      rank: "Chưa xếp hạng",
      skinCount: 0,
      heroCount: 12,
      level: 5,
      code: "LQ-REG001",
    },
    images: ["https://picsum.photos/seed/lq3/400/300"],
    loginInfo: { username: "acc_lq_03", password: "pass123" },
    isActive: true,
    isSold: false,
  },
  {
    title: "Acc Liên Quân - RLP Cao #04",
    game: "lien-quan",
    type: "rlp",
    price: 320000,
    description: "Acc RLP cao, nhiều skin, tướng đầy đủ",
    attributes: {
      rank: "Thách Đấu",
      skinCount: 200,
      heroCount: 110,
      level: 30,
      code: "LQ-RLP001",
      originalPrice: 400000,
      discount: 20,
    },
    images: ["https://picsum.photos/seed/lq4/400/300"],
    loginInfo: { username: "acc_lq_04", password: "pass123" },
    isActive: true,
    isSold: false,
  },
  {
    title: "Acc Liên Quân - Thông Tin Đẹp #05",
    game: "lien-quan",
    type: "trang",
    price: 185000,
    description: "Acc thông tin đẹp, rank Vinh Quang",
    attributes: {
      rank: "Vinh Quang",
      skinCount: 85,
      heroCount: 75,
      level: 30,
      code: "LQ-TD005",
      originalPrice: 220000,
      discount: 15,
    },
    images: ["https://picsum.photos/seed/lq5/400/300"],
    loginInfo: { username: "acc_lq_05", password: "pass123" },
    isActive: true,
    isSold: false,
  },
  {
    title: "Acc Liên Quân - Reg #06",
    game: "lien-quan",
    type: "reg",
    price: 50000,
    description: "Acc reg sạch, đã lên level 10",
    attributes: {
      rank: "Chưa xếp hạng",
      skinCount: 3,
      heroCount: 18,
      level: 10,
      code: "LQ-REG002",
    },
    images: ["https://picsum.photos/seed/lq6/400/300"],
    loginInfo: { username: "acc_lq_06", password: "pass123" },
    isActive: true,
    isSold: false,
  },
  // ─── Valorant ─────────────────────────────────────────────────────────
  {
    title: "Acc Valorant - Rank Vàng #01",
    game: "valorant",
    type: "rank",
    price: 180000,
    description: "Acc rank Vàng 3, nhiều skin",
    attributes: {
      rank: "Vàng 3",
      skinCount: 15,
      level: 20,
      code: "VAL-R001",
      originalPrice: 250000,
      discount: 28,
    },
    images: ["https://picsum.photos/seed/val1/400/300"],
    loginInfo: { username: "acc_val_01", password: "pass123" },
    isActive: true,
    isSold: false,
  },
  {
    title: "Acc Valorant - Full Skin #02",
    game: "valorant",
    type: "skin",
    price: 650000,
    description: "Acc full skin bundle, nhiều skin giới hạn",
    attributes: {
      rank: "Bạc 2",
      skinCount: 65,
      level: 30,
      code: "VAL-SK001",
    },
    images: ["https://picsum.photos/seed/val2/400/300"],
    loginInfo: { username: "acc_val_02", password: "pass123" },
    isActive: true,
    isSold: false,
  },
  // ─── Free Fire ────────────────────────────────────────────────────────
  {
    title: "Acc Free Fire - VIP #01",
    game: "free-fire",
    type: "vip",
    price: 250000,
    description: "Acc VIP nhiều skin, nhân vật hiếm",
    attributes: {
      rank: "Huyền Thoại",
      skinCount: 35,
      heroCount: 28,
      level: 75,
      code: "FF-VIP001",
      originalPrice: 300000,
      discount: 17,
    },
    images: ["https://picsum.photos/seed/ff1/400/300"],
    loginInfo: { username: "acc_ff_01", password: "pass123" },
    isActive: true,
    isSold: false,
  },
  {
    title: "Acc Free Fire - Bundle Kim Cương #02",
    game: "free-fire",
    type: "vip",
    price: 400000,
    description: "Acc VIP cao cấp, full bundle",
    attributes: {
      rank: "Anh Hùng",
      skinCount: 80,
      heroCount: 40,
      level: 80,
      code: "FF-VIP002",
    },
    images: ["https://picsum.photos/seed/ff2/400/300"],
    loginInfo: { username: "acc_ff_02", password: "pass123" },
    isActive: true,
    isSold: false,
  },
  // ─── Liên Minh ────────────────────────────────────────────────────────
  {
    title: "Acc LMHT - Rank Cao #01",
    game: "lien-minh",
    type: "rank",
    price: 220000,
    description: "Acc rank Kim Cương, nhiều tướng",
    attributes: {
      rank: "Kim Cương",
      skinCount: 25,
      heroCount: 80,
      level: 30,
      code: "LM-R001",
    },
    images: ["https://picsum.photos/seed/lm1/400/300"],
    loginInfo: { username: "acc_lm_01", password: "pass123" },
    isActive: true,
    isSold: false,
  },
  {
    title: "Acc LMHT - Full Skin #02",
    game: "lien-minh",
    type: "skin",
    price: 500000,
    description: "Acc full skin, nhiều trang phục giới hạn",
    attributes: {
      rank: "Bạch Kim",
      skinCount: 150,
      heroCount: 120,
      level: 30,
      code: "LM-SK001",
      originalPrice: 600000,
      discount: 17,
    },
    images: ["https://picsum.photos/seed/lm2/400/300"],
    loginInfo: { username: "acc_lm_02", password: "pass123" },
    isActive: true,
    isSold: false,
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");

  // Clear existing data
  await Account.deleteMany({});
  await User.deleteMany({ username: { $in: USERS.map((u) => u.username) } });
  await Order.deleteMany({});

  console.log("🗑️  Cleared existing seed data");

  // Create users
  const createdUsers = [];
  for (const u of USERS) {
    const hashedPassword = await bcrypt.hash(u.password, 12);
    const user = await User.create({
      username: u.username,
      email: u.email,
      hashedPassword,
      displayName: u.displayName,
      balance: u.balance,
      isVerified: u.isVerified,
    });
    createdUsers.push(user);
    console.log(`👤 Created user: ${u.username} (pass: ${u.password})`);
  }

  // Create accounts
  const createdAccounts = [];
  for (const a of ACCOUNTS) {
    const account = await Account.create(a);
    createdAccounts.push(account);
    console.log(
      `📦 Created account: ${a.title.slice(0, 30)} — ${a.price.toLocaleString("vi-VN")}đ`,
    );
  }

  // Create some completed orders for review flow
  const testUser = createdUsers[0];

  // Sell only 1 account to test user (keep plenty for UI testing)
  const soldAccounts = createdAccounts.slice(0, 1);
  for (const acc of soldAccounts) {
    const order = await Order.create({
      transactionId: `TXN${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      user: testUser._id,
      account: acc._id,
      amount: acc.price,
      originalPrice: acc.attributes?.originalPrice || acc.price,
      paymentMethod: "balance",
      status: "completed",
      completedAt: new Date(),
      notes: `Mua tài khoản ${acc.title}`,
    });

    // Mark account as sold
    await Account.findByIdAndUpdate(acc._id, {
      isSold: true,
      soldTo: testUser._id,
      soldAt: new Date(),
    });

    // Deduct balance
    await User.findByIdAndUpdate(testUser._id, {
      $inc: { balance: -acc.price },
    });

    console.log(`🛒 Order created: ${acc.title} — ${acc.price.toLocaleString("vi-VN")}đ`);
    await new Promise((r) => setTimeout(r, 50)); // Ensure unique transactionId
  }

  // Update user balance display
  const updatedUser = await User.findById(testUser._id);
  console.log(
    `💰 ${testUser.username} balance: ${updatedUser.balance.toLocaleString("vi-VN")}đ`,
  );

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Seed data created successfully!");
  console.log(`📊 ${createdAccounts.length} accounts`);
  console.log(`👤 ${createdUsers.length} users`);
  console.log(`🛒 ${soldAccounts.length} orders (completed)`);
  console.log(`\n🔐 Test user: ${USERS[0].username} / ${USERS[0].password}`);
  console.log(`🔐 Admin user: ${USERS[1].username} / ${USERS[1].password}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
