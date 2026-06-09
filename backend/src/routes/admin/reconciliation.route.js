import express from "express";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  getReconciliationSummary,
  getReconciliationDeposits,
  getReconciliationAlerts,
  getChartData,
  getMismatches,
  resolveMismatch,
} from "../../controllers/admin/reconciliation.controller.js";

const router = express.Router();

router.use(adminLimiter);
router.use(adminProtect);

router.get("/summary", getReconciliationSummary);
router.get("/deposits", getReconciliationDeposits);
router.get("/alerts", getReconciliationAlerts);
router.get("/chart-data", getChartData);
router.get("/mismatches", getMismatches);
router.patch("/mismatches/:id/resolve", resolveMismatch);

export default router;
