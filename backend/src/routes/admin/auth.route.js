import express from "express";
import {
  changePassword,
  disableTwoFactor,
  getMe,
  getTwoFactorStatus,
  login,
  logout,
  refresh,
  setupTwoFactor,
  updateProfile,
  verifyTwoFactor,
  verifyTwoFactorLogin,
} from "../../controllers/admin/auth.controller.js";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  adminLoginSchema,
  adminTwoFactorCodeSchema,
  adminTwoFactorDisableSchema,
  adminTwoFactorVerifySchema,
} from "../../validation/validation.schemas.js";
import { strictLimiter } from "../../middlewares/rateLimiter.middleware.js";
import cookieParser from "cookie-parser";

const router = express.Router();

router.use(cookieParser()); // Bắt buộc để đọc cookie
router.post("/login", strictLimiter, validate(adminLoginSchema), login);
router.post("/logout", adminProtect, logout);

router.get("/me", adminProtect, getMe);
router.put("/profile", adminProtect, updateProfile);
router.put("/profile/password", adminProtect, changePassword);

// ─── Refresh Token Rotation ───────────────────────────────────────────────
// No adminProtect — uses refresh token cookie for auth
router.post("/refresh", refresh);

// ─── 2FA Routes ──────────────────────────────────────────────────────────
router.get("/2fa/status", adminProtect, getTwoFactorStatus);
router.post("/2fa/setup", adminProtect, setupTwoFactor);
router.post(
  "/2fa/verify",
  adminProtect,
  validate(adminTwoFactorCodeSchema),
  verifyTwoFactor,
);
router.post(
  "/2fa/disable",
  adminProtect,
  validate(adminTwoFactorDisableSchema),
  disableTwoFactor,
);

// 2FA login step 2 (no adminProtect — uses tempToken)
router.post(
  "/verify-2fa-login",
  strictLimiter,
  validate(adminTwoFactorVerifySchema),
  verifyTwoFactorLogin,
);

export default router;
