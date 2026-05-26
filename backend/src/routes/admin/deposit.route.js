import express from "express";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  exportDepositsCsv,
  getDepositById,
  listDeposits,
  updateDepositStatus,
} from "../../controllers/admin/deposit.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { updateDepositStatusSchema } from "../../validation/validation.schemas.js";

const router = express.Router();

router.use(adminLimiter);
router.use(adminProtect);

router.get("/", listDeposits);
router.get("/:id", getDepositById);
router.patch("/:id/status", validate(updateDepositStatusSchema), updateDepositStatus);
router.get("/export", exportDepositsCsv);

export default router;
