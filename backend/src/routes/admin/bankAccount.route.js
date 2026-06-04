import express from "express";
import {
  adminProtect,
  requireRole,
} from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  listBankAccounts,
  getBankAccount,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  toggleBankActive,
} from "../../controllers/admin/bankAccount.controller.js";

const router = express.Router();

router.use(adminLimiter);
router.use(adminProtect);

router.get("/", listBankAccounts);
router.get("/:id", getBankAccount);

// Write operations require super_admin or admin
router.post("/", requireRole("super_admin", "admin"), createBankAccount);
router.put("/:id", requireRole("super_admin", "admin"), updateBankAccount);
router.delete("/:id", requireRole("super_admin"), deleteBankAccount);
router.patch("/:id/toggle-active", requireRole("super_admin", "admin"), toggleBankActive);

export default router;
