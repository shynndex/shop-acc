import express from "express";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  getPaymentSummary,
  getWebhookLogs,
  getRecentTransactions,
  getPaymentStats,
} from "../../controllers/admin/paymentMonitor.controller.js";

const router = express.Router();

router.use(adminLimiter);
router.use(adminProtect);

router.get("/summary", getPaymentSummary);
router.get("/webhook-logs", getWebhookLogs);
router.get("/recent", getRecentTransactions);
router.get("/stats", getPaymentStats);

export default router;
