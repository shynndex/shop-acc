import bcrypt from "bcrypt";
import User from "../models/client/User.model.js";
import jwt from "jsonwebtoken";
import Session from "../models/client/Session.model.js";
import crypto from "crypto";
import { sendVerificationEmail, sendResetPasswordEmail } from "../services/mail.service.js";
import { asyncHandler, AppError } from "../middlewares/errorHandler.js";
import { notifyNewUser } from "../services/telegram.service.js";

const ACCESS_TOKEN_SECRET_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

// ── Brute-force protection ──────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 phút

export const signUp = asyncHandler(async (req, res) => {
  const { username, password, email, firstName, lastName } = req.body;

  if (!username || !password || !email) {
    throw new AppError("Vui lòng điền đầy đủ thông tin", 400);
  }

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    throw new AppError("Tên đăng nhập hoặc email đã tồn tại", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const displayName = username;

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await User.create({
    username,
    hashedPassword,
    email,
    displayName,
    verificationToken,
    verificationTokenExpiry,
  });

  // Gửi email xác thực (silent fail — không block registration)
  try {
    await sendVerificationEmail(email, verificationToken, displayName);
  } catch (emailErr) {
    console.warn("[Auth] Failed to send verification email:", emailErr.message);
  }

  // Telegram notification (silent fail)
  notifyNewUser(username, email);

  res.status(201).json({ message: "Tạo tài khoản thành công" });
});

export const signIn = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    throw new AppError("Thiếu dữ liệu", 400);
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select("+hashedPassword +failedLoginAttempts +lockoutUntil");

  if (!user) {
    throw new AppError("Sai email/tên đăng nhập hoặc password", 401);
  }

  // ── Check lockout ──────────────────────────────────────────────────────
  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    const remainingMs = user.lockoutUntil.getTime() - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    throw new AppError(
      `Tài khoản đã bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${remainingMin} phút.`,
      429,
    );
  }
  // Reset lockout if duration has passed
  if (user.lockoutUntil && user.lockoutUntil <= new Date()) {
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();
  }

  if (!user.isVerified) {
    throw new AppError(
      "Email chưa được xác thực. Vui lòng kiểm tra hộp thư hoặc yêu cầu gửi lại link.",
      403,
    );
  }

  const userData = {
    id: user._id.toString(), // ← Quan trọng: chuyển ObjectId → string
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    balance: user.balance,
    createdAt: user.createdAt,
  };

  const passwordCorrect = await user.comparePassword(password);

  if (!passwordCorrect) {
    // ── Increment failed attempts ─────────────────────────────────────────
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION);
    }
    await user.save();
    throw new AppError("Sai email hoặc password", 401);
  }

  // ── Reset on successful login ──────────────────────────────────────────
  if (user.failedLoginAttempts || user.lockoutUntil) {
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();
  }

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_SECRET_TTL },
  );
  const refreshToken = crypto.randomBytes(64).toString("hex");

  await Session.create({
    userId: user._id,
    refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: REFRESH_TOKEN_TTL,
  });
  res.status(200).json({
    success: true,
    message: `User ${user.displayName} đã đăng nhập thành công`,
    data: { accessToken, user: userData },
  });
});

export const signOut = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await Session.deleteMany({
      $or: [{ refreshToken: token }, { userId: req.user?.id }],
    });
    res.clearCookie("refreshToken", { path: "/" });
  }
  res.sendStatus(204);
});

/**
 * Refresh Token Rotation with Reuse Detection
 *
 * Flow:
 *   1. Look up session by refreshToken OR previousRefreshToken
 *   2. If matched by previousRefreshToken → token reuse detected!
 *      This means the token was stolen and already rotated by attacker.
 *      → Revoke ALL sessions for this user (force logout everywhere)
 *   3. If matched by refreshToken → normal rotation:
 *      - Move current refreshToken → previousRefreshToken
 *      - Generate new refreshToken
 *      - Extend expiry
 *   4. Return new accessToken + new refreshToken cookie
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken;
  if (!oldRefreshToken) {
    throw new AppError("Không tìm thấy token làm mới", 401);
  }

  // ── Look for session by current OR previous refresh token ────────
  const session = await Session.findOne({
    $or: [
      { refreshToken: oldRefreshToken },
      { previousRefreshToken: oldRefreshToken },
    ],
  });

  if (!session) {
    // Token không tồn tại trong cả 2 field
    res.clearCookie("refreshToken", { path: "/" });
    throw new AppError("Token làm mới không hợp lệ", 401);
  }

  // ── REUSE DETECTED ───────────────────────────────────────────────
  if (session.previousRefreshToken === oldRefreshToken) {
    // Token cũ (đã được rotate) đang bị dùng lại → đánh cắp token!
    // Thu hồi TẤT CẢ session của user này
    await Session.deleteMany({ userId: session.userId });

    res.clearCookie("refreshToken", { path: "/" });
    throw new AppError(
      "Phiên đăng nhập đã bị thu hồi do phát hiện bất thường. Vui lòng đăng nhập lại.",
      401,
    );
  }

  // ── Check expiry ─────────────────────────────────────────────────
  if (session.expiresAt < new Date()) {
    await Session.deleteOne({ _id: session._id });
    res.clearCookie("refreshToken", { path: "/" });
    throw new AppError("Token làm mới đã hết hạn", 401);
  }

  // ── Normal rotation ──────────────────────────────────────────────
  const newRefreshToken = crypto.randomBytes(64).toString("hex");

  // Move current token to previous, set new token
  session.previousRefreshToken = session.refreshToken;
  session.refreshToken = newRefreshToken;
  session.expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL);
  await session.save();

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: REFRESH_TOKEN_TTL,
    path: "/",
  });

  const accessToken = jwt.sign(
    { userId: session.userId.toString() },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_SECRET_TTL },
  );

  res.json({ accessToken });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw new AppError("Token xác minh không hợp lệ", 400);
  }

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError("Token xác minh không hợp lệ hoặc đã hết hạn", 400);
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Email đã được xác minh thành công! Bạn có thể đăng nhập.",
  });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError("Email không hợp lệ", 400);

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Người dùng không tồn tại", 404);
  }
  if (user.isVerified) {
    throw new AppError("Tài khoản đã được xác minh", 400);
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.verificationToken = verificationToken;
  user.verificationTokenExpiry = verificationTokenExpiry;

  await user.save();

  await sendVerificationEmail(
    user.email,
    verificationToken,
    user.displayName,
  );

  res
    .status(200)
    .json({ success: true, message: "Đã gửi lại link xác thực. Vui lòng kiểm tra email." });
});

export const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError("Người dùng không tồn tại", 401);
  }

  const user = await User.findOne({ _id: req.user._id });
  res.json({
    success: true,
    user,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Vui lòng nhập email", 400);
  }

  const user = await User.findOne({ email });

  // Luôn trả về thành công dù email có tồn tại hay không (chống leak thông tin)
  if (!user) {
    return res.json({
      success: true,
      message:
        "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
  await user.save();

  await sendResetPasswordEmail(user.email, resetToken, user.displayName);

  res.json({
    success: true,
    message:
      "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new AppError("Thiếu dữ liệu", 400);
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError("Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn", 400);
  }

  user.hashedPassword = await bcrypt.hash(password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // Reset failed login attempts vì đây là chủ tài khoản
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;

  await user.save();

  // ── Vô hiệu hóa tất cả session cũ ─────────────────────────────────
  await Session.deleteMany({ userId: user._id });

  res.json({
    success: true,
    message: "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.",
  });
});

export const updateDisplayName = asyncHandler(async (req, res) => {
  const { displayName } = req.body;
  const userId = req.user._id;

  if (!displayName || !displayName.trim()) {
    throw new AppError("Vui lòng nhập tên hiển thị", 400);
  }

  if (displayName.trim().length > 30) {
    throw new AppError("Tên hiển thị tối đa 30 ký tự", 400);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { displayName: displayName.trim() },
    { new: true, select: "displayName" },
  );

  if (!user) {
    throw new AppError("Người dùng không tồn tại", 404);
  }

  res.json({
    success: true,
    message: "Cập nhật tên hiển thị thành công",
    data: { displayName: user.displayName },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user._id;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError("Vui lòng nhập đầy đủ thông tin", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("Mật khẩu mới phải có ít nhất 6 ký tự", 400);
  }

  if (newPassword !== confirmPassword) {
    throw new AppError("Mật khẩu xác nhận không khớp", 400);
  }

  const user = await User.findById(userId).select("+hashedPassword");
  if (!user) {
    throw new AppError("Người dùng không tồn tại", 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError("Mật khẩu hiện tại không đúng", 400);
  }

  user.hashedPassword = await bcrypt.hash(newPassword, 12);
  await user.save();

  res.json({
    success: true,
    message: "Đổi mật khẩu thành công",
  });
});
