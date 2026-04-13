import express from "express";
import {
  signUp,
  signIn,
  signOut,
  refreshToken,
  verifyEmail,
  resendVerification,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/sign-up", signUp);
router.post("/sign-in", signIn);
router.post("/sign-out", signOut);
router.post("/refresh-token", refreshToken);
router.get("/verify-email", verifyEmail);
router.post("/resend-verify", resendVerification);

export default router;
