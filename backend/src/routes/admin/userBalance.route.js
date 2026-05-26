import express from "express";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { z } from "zod";
import {
  searchUsers,
  getUserBalanceLog,
  adjustUserBalance,
} from "../../controllers/admin/userBalance.controller.js";

const router = express.Router();

router.use(adminLimiter);
router.use(adminProtect);

router.get("/search", searchUsers);

// Validation schema for balance adjustment
const adjustBalanceSchema = z.object({
  amount: z.number({ required_error: "Số tiền là bắt buộc" })
    .refine((v) => v !== 0, "Số tiền phải khác 0"),
  reason: z.string({ required_error: "Lý do là bắt buộc" })
    .min(5, "Lý do tối thiểu 5 ký tự")
    .max(500, "Lý do tối đa 500 ký tự"),
});

router.get("/:userId/balance-log", getUserBalanceLog);
router.post("/:userId/balance-adjust", validate(adjustBalanceSchema), adjustUserBalance);

export default router;
