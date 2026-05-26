import express from "express";
import {
  signUp,
  signIn,
  signOut,
  refreshToken,
  verifyEmail,
  resendVerification,
  changePassword,
  getMe,
} from "../controllers/auth.controller.js";
import { protectedRoute } from "../middlewares/client/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  signUpSchema,
  signInSchema,
  changePasswordSchema,
  resendVerificationSchema,
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

// ⚡ Brute-force detection — failed attempts tracked in-memory per IP
// loginLimiter (5 req / 15 min) provides a hard block on top of any
// application-level account lockout logic.
router.post("/sign-out", signOut);
router.post("/refresh-token", refreshToken);
router.get("/verify-email", verifyEmail);
router.post("/resend-verify", moderateLimiter, validate(resendVerificationSchema), resendVerification);

// Protected routes
router.get("/me", protectedRoute, getMe);
router.put("/change-password", protectedRoute, validate(changePasswordSchema), changePassword);

export default router;
