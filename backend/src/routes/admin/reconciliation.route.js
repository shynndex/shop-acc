import express from "express";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  getReconciliationSummary,
  getReconciliationDeposits,
  getReconciliationAlerts,
} from "../../controllers/admin/reconciliation.controller.js";

const router = express.Router();

router.use(adminLimiter);
router.use(adminProtect);

router.get("/summary", getReconciliationSummary);
router.get("/deposits", getReconciliationDeposits);
router.get("/alerts", getReconciliationAlerts);

export default router;
