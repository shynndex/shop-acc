import express from "express";
import {
  adminProtect,
  requireRole,
} from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import { getDashboard, getRevenueTrend } from "../../controllers/admin/analytics.controller.js";

const router = express.Router();

// 🛡️ Rate limit + auth
router.use(adminLimiter);
router.use(adminProtect);

// Dashboard + analytics
router.get("/dashboard", getDashboard);
router.get("/revenue-trend", getRevenueTrend);

export default router;
