import jwt from "jsonwebtoken";
import { getCookieOptions } from "../../libs/cookie.config.js";
import Admin from "../../models/admin/Admin.model.js";
import { asyncHandler, AppError } from "../../middlewares/errorHandler.js";

// ── Brute-force protection ──────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 phút

const generateToken = (admin) => {
  return jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_ADMIN_SECRET,
    { expiresIn: "15m" },
  );
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Vui lòng nhập đầy đủ thông tin", 400);
  }

  const admin = await Admin.findOne({ email }).select("+password +failedLoginAttempts +lockoutUntil");
  if (!admin) {
    throw new AppError("Email hoặc mật khẩu không đúng", 401);
  }

  // ── Check lockout ──────────────────────────────────────────────────────
  if (admin.lockoutUntil && admin.lockoutUntil > new Date()) {
    const remainingMs = admin.lockoutUntil.getTime() - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    throw new AppError(
      `Tài khoản đã bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${remainingMin} phút.`,
      429,
    );
  }
  // Reset lockout if duration has passed
  if (admin.lockoutUntil && admin.lockoutUntil <= new Date()) {
    admin.failedLoginAttempts = 0;
    admin.lockoutUntil = null;
    await admin.save();
  }

  const passwordCorrect = await admin.matchPassword(password);
  if (!passwordCorrect) {
    // ── Increment failed attempts ─────────────────────────────────────────
    admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
    if (admin.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      admin.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION);
    }
    await admin.save();
    throw new AppError("Email hoặc mật khẩu không đúng", 401);
  }

  if (!admin.isActive) {
    throw new AppError("Tài khoản đã bị khóa", 403);
  }

  // ── Reset on successful login ──────────────────────────────────────────
  if (admin.failedLoginAttempts || admin.lockoutUntil) {
    admin.failedLoginAttempts = 0;
    admin.lockoutUntil = null;
  }
  admin.lastLogin = new Date();
  admin.loginIP = req.ip;
  await admin.save();

  const token = generateToken(admin);
  res.cookie("admin_token", token, getCookieOptions());

  res.json({
    success: true,
    admin: {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    },
  });
});

export const logout = (req, res) => {
  res.clearCookie("admin_token", { path: "/api/admin" });
  res.json({ success: true, message: "Đăng xuất thành công" });
};

export const getMe = asyncHandler((req, res) => {
  if (!req.admin) {
    throw new AppError("Người dùng không tồn tại", 401);
  }
  res.json({ success: true, admin: req.admin });
});
