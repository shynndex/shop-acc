import express from "express";
import {
  signUp,
  signIn,
  signOut,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  updateDisplayName,
  getMe,
} from "../controllers/auth.controller.js";
import { protectedRoute } from "../middlewares/client/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  signUpSchema,
  signInSchema,
  changePasswordSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validation/validation.schemas.js";
import {
  loginLimiter,
  strictLimiter,
  moderateLimiter,
} from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

// 🛡️ Rate limited + validated
router.post("/sign-up", moderateLimiter, validate(signUpSchema), signUp);
router.post("/sign-in", loginLimiter, validate(signInSchema), signIn);

router.post("/sign-out", moderateLimiter, signOut);
router.post("/refresh-token", strictLimiter, refreshToken);
router.get("/verify-email", verifyEmail);
router.post("/resend-verify", moderateLimiter, validate(resendVerificationSchema), resendVerification);
router.post("/forgot-password", moderateLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", moderateLimiter, validate(resetPasswordSchema), resetPassword);

// Protected routes
router.get("/me", protectedRoute, getMe);
router.put("/change-password", protectedRoute, moderateLimiter, validate(changePasswordSchema), changePassword);
router.put("/display-name", protectedRoute, moderateLimiter, updateDisplayName);

export default router;
