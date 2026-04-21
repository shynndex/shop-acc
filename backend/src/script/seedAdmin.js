import mongoose from "mongoose";
import Admin from "../models/admin/Admin.model.js";
import dotenv from "dotenv";
dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const exists = await Admin.findOne({ email: "admin@system.local" });
    if (exists) return console.log("Admin đã tồn tại.");

    await Admin.create({
      username: "superadmin",
      email: "admin@system.local",
      password: "Admin@Secure123",
      role: "super_admin",
      isActive: true,
    });
    console.log("Super Admin created!");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
seed();
