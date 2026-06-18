import jwt from "jsonwebtoken";
import crypto from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { getCookieOptions, getRefreshCookieOptions } from "../../libs/cookie.config.js";
import Admin from "../../models/admin/Admin.model.js";
import { asyncHandler, AppError } from "../../middlewares/errorHandler.js";
import { logAdminAction } from "../../services/adminAudit.service.js";

// ── Brute-force protection ──────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 10;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 phút

const generateToken = (admin) => {
  return jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_ADMIN_SECRET,
    { expiresIn: "24h" },
  );
};

/**
 * Generate a cryptographically random refresh token.
 * Returns the raw token string (to send to client) and its SHA256 hash (to store in DB).
 */
function generateRefreshToken() {
  const raw = crypto.randomBytes(40).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

const generateTempToken = (adminId) => {
  return jwt.sign(
    { id: adminId, purpose: "2fa-login" },
    process.env.JWT_ADMIN_SECRET,
    { expiresIn: "5m" },
  );
};

// ─── LOGIN (Step 1) ───────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Vui lòng nhập đầy đủ thông tin", 400);
  }

  const admin = await Admin.findOne({ email }).select(
    "+password +failedLoginAttempts +lockoutUntil +totpSecret",
  );
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

  // ── Reset failed attempts on successful password ──────────────────────
  if (admin.failedLoginAttempts || admin.lockoutUntil) {
    admin.failedLoginAttempts = 0;
    admin.lockoutUntil = null;
    // Don't save yet — we'll save after 2FA verification (or now if no 2FA)
  }

  // ── If 2FA is enabled, return tempToken for step 2 ───────────────────
  if (admin.totpEnabled) {
    await admin.save(); // Save failed-attempts reset

    const tempToken = generateTempToken(admin._id);

    logAdminAction({
      adminId: admin._id,
      adminName: admin.username,
      action: "admin:login:step1",
      resource: "auth",
      details: { email: admin.email, requiresTwoFactor: true },
      ip: req.ip,
    });

    return res.json({
      success: true,
      requiresTwoFactor: true,
      tempToken,
      message: "Vui lòng xác thực 2FA để hoàn tất đăng nhập",
    });
  }

  // ── No 2FA — complete login as normal ──────────────────────────────────
  admin.lastLogin = new Date();
  admin.loginIP = req.ip;

  // Issue both access + refresh tokens
  await issueTokens(res, admin);

  logAdminAction({
    adminId: admin._id,
    adminName: admin.username,
    action: "admin:login",
    resource: "auth",
    details: { email: admin.email, role: admin.role },
    ip: req.ip,
  });

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

// ─── VERIFY 2FA LOGIN (Step 2) ────────────────────────────────────────────
export const verifyTwoFactorLogin = asyncHandler(async (req, res) => {
  const { tempToken, totpCode } = req.body;

  if (!tempToken || !totpCode) {
    throw new AppError("Vui lòng cung cấp mã tạm thời và mã 2FA", 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_ADMIN_SECRET);
  } catch (err) {
    throw new AppError("Mã xác thực tạm thời không hợp lệ hoặc đã hết hạn", 401);
  }

  if (decoded.purpose !== "2fa-login") {
    throw new AppError("Mã tạm thời không hợp lệ", 401);
  }

  const admin = await Admin.findById(decoded.id).select(
    "+totpSecret",
  );
  if (!admin || !admin.isActive) {
    throw new AppError("Tài khoản không tồn tại hoặc đã bị khóa", 403);
  }

  if (!admin.totpEnabled || !admin.totpSecret) {
    throw new AppError("2FA chưa được bật cho tài khoản này", 400);
  }

  const verified = speakeasy.totp.verify({
    secret: admin.totpSecret,
    encoding: "base32",
    token: totpCode,
    window: 1,
  });

  if (!verified) {
    throw new AppError("Mã xác thực 2FA không đúng", 401);
  }

  // ── Complete login ────────────────────────────────────────────────────
  admin.lastLogin = new Date();
  admin.loginIP = req.ip;

  // Issue both access + refresh tokens
  await issueTokens(res, admin);

  logAdminAction({
    adminId: admin._id,
    adminName: admin.username,
    action: "admin:login",
    resource: "auth",
    details: { email: admin.email, role: admin.role, authMethod: "2fa" },
    ip: req.ip,
  });

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

// ─── SETUP 2FA ─────────────────────────────────────────────────────────────
export const setupTwoFactor = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id).select("+totpSecret");
  if (!admin) {
    throw new AppError("Không tìm thấy tài khoản", 404);
  }

  if (admin.totpEnabled) {
    throw new AppError("2FA đã được bật. Vui lòng tắt trước khi thiết lập lại", 400);
  }

  // Generate new secret
  const secret = speakeasy.generateSecret({
    name: `ShopAccLQ:${admin.email}`,
    issuer: "ShopAccLQ Admin",
  });

  // Store secret temporarily (not enabled yet — must verify first)
  admin.totpSecret = secret.base32;
  await admin.save();

  // Generate QR code as data URL
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  logAdminAction({
    adminId: admin._id,
    adminName: admin.username,
    action: "admin:2fa:setup",
    resource: "auth",
    details: { email: admin.email },
    ip: req.ip,
  });

  res.json({
    success: true,
    secret: secret.base32,
    qrCode,
    message: "Quét mã QR bằng ứng dụng Authenticator (Google Authenticator, Authy...)",
  });
});

// ─── VERIFY & ENABLE 2FA ─────────────────────────────────────────────────
export const verifyTwoFactor = asyncHandler(async (req, res) => {
  const { totpCode } = req.body;

  if (!totpCode) {
    throw new AppError("Vui lòng nhập mã xác thực từ ứng dụng Authenticator", 400);
  }

  const admin = await Admin.findById(req.admin._id).select("+totpSecret");
  if (!admin) {
    throw new AppError("Không tìm thấy tài khoản", 404);
  }

  if (!admin.totpSecret) {
    throw new AppError(
      "Chưa có mã bí mật 2FA. Vui lòng gọi API setup-2fa trước",
      400,
    );
  }

  if (admin.totpEnabled) {
    throw new AppError("2FA đã được bật", 400);
  }

  const verified = speakeasy.totp.verify({
    secret: admin.totpSecret,
    encoding: "base32",
    token: totpCode,
    window: 1,
  });

  if (!verified) {
    throw new AppError("Mã xác thực không đúng. Vui lòng thử lại", 400);
  }

  // Enable 2FA
  admin.totpEnabled = true;
  admin.totpVerifiedAt = new Date();
  await admin.save();

  logAdminAction({
    adminId: admin._id,
    adminName: admin.username,
    action: "admin:2fa:verify",
    resource: "auth",
    details: { email: admin.email },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: "2FA đã được bật thành công",
  });
});

// ─── DISABLE 2FA ──────────────────────────────────────────────────────────
export const disableTwoFactor = asyncHandler(async (req, res) => {
  const { password, totpCode } = req.body;

  if (!password || !totpCode) {
    throw new AppError("Vui lòng nhập mật khẩu và mã xác thực 2FA", 400);
  }

  const admin = await Admin.findById(req.admin._id).select(
    "+password +totpSecret",
  );
  if (!admin) {
    throw new AppError("Không tìm thấy tài khoản", 404);
  }

  if (!admin.totpEnabled) {
    throw new AppError("2FA chưa được bật", 400);
  }

  // Verify password
  const passwordCorrect = await admin.matchPassword(password);
  if (!passwordCorrect) {
    throw new AppError("Mật khẩu không đúng", 401);
  }

  // Verify TOTP
  const verified = speakeasy.totp.verify({
    secret: admin.totpSecret,
    encoding: "base32",
    token: totpCode,
    window: 1,
  });

  if (!verified) {
    throw new AppError("Mã xác thực 2FA không đúng", 401);
  }

  // Disable 2FA
  admin.totpSecret = null;
  admin.totpEnabled = false;
  admin.totpVerifiedAt = null;
  await admin.save();

  logAdminAction({
    adminId: admin._id,
    adminName: admin.username,
    action: "admin:2fa:disable",
    resource: "auth",
    details: { email: admin.email },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: "2FA đã được tắt thành công",
  });
});

// ─── GET 2FA STATUS ──────────────────────────────────────────────────────
export const getTwoFactorStatus = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id);
  if (!admin) {
    throw new AppError("Không tìm thấy tài khoản", 404);
  }

  res.json({
    success: true,
    totpEnabled: admin.totpEnabled,
    totpVerifiedAt: admin.totpVerifiedAt,
  });
});

// ─── LOGOUT ────────────────────────────────────────────────────────────────
export const logout = (req, res) => {
  logAdminAction({
    adminId: req.admin?._id,
    adminName: req.admin?.username || "unknown",
    action: "admin:logout",
    resource: "auth",
    details: { email: req.admin?.email },
    ip: req.ip,
  });

  // Clear both access + refresh cookies on logout
  res.clearCookie("admin_token", { path: "/api/admin" });
  res.clearCookie("admin_refresh", { path: "/api/admin" });
  res.json({ success: true, message: "Đăng xuất thành công" });
};

// ─── GET ME ────────────────────────────────────────────────────────────────
export const getMe = asyncHandler((req, res) => {
  if (!req.admin) {
    throw new AppError("Người dùng không tồn tại", 401);
  }
  res.json({ success: true, admin: req.admin });
});

// ─── UPDATE PROFILE ─────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const { username, email } = req.body;

  if (!username && !email) {
    throw new AppError("Vui lòng nhập thông tin cần cập nhật (username hoặc email)", 400);
  }

  const updateData = {};
  if (username !== undefined) updateData.username = username.trim();
  if (email !== undefined) updateData.email = email.toLowerCase().trim();

  // Check duplicate email/username
  const duplicateCheck = [];
  if (updateData.email) duplicateCheck.push({ email: updateData.email, _id: { $ne: req.admin._id } });
  if (updateData.username) duplicateCheck.push({ username: updateData.username, _id: { $ne: req.admin._id } });

  if (duplicateCheck.length > 0) {
    const existing = await Admin.findOne({ $or: duplicateCheck });
    if (existing) {
      throw new AppError(
        existing.email === (updateData.email || req.admin.email)
          ? "Email đã được sử dụng"
          : "Tên đăng nhập đã tồn tại",
        409,
      );
    }
  }

  const updated = await Admin.findByIdAndUpdate(
    req.admin._id,
    { $set: updateData },
    { new: true, runValidators: true },
  ).select("-password -refreshToken -refreshTokenUsed -totpSecret");

  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "admin:profile:update",
    resource: "auth",
    details: { changes: Object.keys(updateData) },
    ip: req.ip,
  });

  res.json({
    success: true,
    data: {
      id: updated._id,
      username: updated.username,
      email: updated.email,
      role: updated.role,
      avatar: updated.avatar,
      isActive: updated.isActive,
      lastLogin: updated.lastLogin,
    },
  });
});

// ─── CHANGE PASSWORD ─────────────────────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("Mật khẩu mới phải có ít nhất 6 ký tự", 400);
  }

  if (currentPassword === newPassword) {
    throw new AppError("Mật khẩu mới không được trùng với mật khẩu hiện tại", 400);
  }

  const admin = await Admin.findById(req.admin._id).select("+password");
  if (!admin) {
    throw new AppError("Không tìm thấy tài khoản", 404);
  }

  const isMatch = await admin.matchPassword(currentPassword);
  if (!isMatch) {
    throw new AppError("Mật khẩu hiện tại không đúng", 401);
  }

  admin.password = newPassword;
  await admin.save();

  logAdminAction({
    adminId: req.admin._id,
    adminName: req.admin.username,
    action: "admin:profile:change_password",
    resource: "auth",
    details: {},
    ip: req.ip,
  });

  res.json({ success: true, message: "Đã đổi mật khẩu thành công" });
});

// ─── REFRESH TOKEN ─────────────────────────────────────────────────────────

/**
 * Refresh token rotation endpoint.
 *
 * Accepts refresh token from httpOnly cookie, validates it, rotates it,
 * and returns new access + refresh tokens.
 *
 * Theft detection: if a previously-used refresh token is submitted,
 * ALL refresh tokens for that admin are invalidated (session terminated).
 */
export const refresh = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.admin_refresh;
  if (!rawToken) {
    throw new AppError("Không tìm thấy refresh token", 401);
  }

  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const admin = await Admin.findOne({
    $or: [
      { refreshToken: hash },
      { refreshTokenUsed: hash },
    ],
  }).select("+refreshToken +refreshTokenUsed");

  if (!admin) {
    throw new AppError("Refresh token không hợp lệ", 401);
  }

  // ── Theft detection: token was already rotated (reuse detection) ──
  if (admin.refreshTokenUsed?.includes(hash)) {
    console.warn(
      `[SECURITY] Refresh token reuse detected for admin ${admin._id} (${admin.email}).`,
      `All sessions invalidated.`,
    );

    // Invalidate ALL refresh tokens for this admin
    admin.refreshToken = null;
    admin.refreshTokenUsed = [];
    await admin.save();

    // Clear both cookies
    res.clearCookie("admin_token", { path: "/api/admin" });
    res.clearCookie("admin_refresh", { path: "/api/admin" });

    logAdminAction({
      adminId: admin._id,
      adminName: admin.username,
      action: "admin:session:theft_detected",
      resource: "auth",
      details: { email: admin.email, reason: "refresh_token_reuse" },
      ip: req.ip,
    });

    throw new AppError(
      "Phiên đăng nhập đã bị vô hiệu hóa do phát hiện bất thường. Vui lòng đăng nhập lại.",
      401,
    );
  }

  // ── Normal rotation: old → used, generate new ──────────────────
  // Move current token to used list (max 5 old tokens tracked)
  admin.refreshTokenUsed = [...(admin.refreshTokenUsed || []), hash].slice(-5);

  const newToken = generateRefreshToken();
  admin.refreshToken = newToken.hash;
  await admin.save();

  // Generate new access token
  const accessToken = generateToken(admin);

  // Set cookies
  res.cookie("admin_token", accessToken, getCookieOptions());
  res.cookie("admin_refresh", newToken.raw, getRefreshCookieOptions());

  logAdminAction({
    adminId: admin._id,
    adminName: admin.username,
    action: "admin:session:refresh",
    resource: "auth",
    details: { email: admin.email },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: "Token đã được làm mới",
  });
});

// ─── ATTACH REFRESH TOKEN TO LOGIN ────────────────────────────────────────

/**
 * Helper: issue both access + refresh tokens after successful authentication.
 * Called by login + verifyTwoFactorLogin to avoid duplication.
 */
async function issueTokens(res, admin) {
  const accessToken = generateToken(admin);
  const { raw: refreshRaw, hash: refreshHash } = generateRefreshToken();

  // Store refresh token hash in DB, rotate out old one
  admin.refreshToken = refreshHash;
  admin.refreshTokenUsed = []; // Reset used tokens on fresh login
  await admin.save();

  res.cookie("admin_token", accessToken, getCookieOptions());
  res.cookie("admin_refresh", refreshRaw, getRefreshCookieOptions());

  return { accessToken, refreshToken: refreshRaw };
}
