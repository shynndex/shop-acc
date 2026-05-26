import express from "express";
import {
  adminProtect,
  requireRole,
} from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  createAccount,
  getAccountById,
  getAccounts,
  updateAccount,
  deleteAccount,
  toggleAccountStatus,
} from "../../controllers/admin/account.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createAccountSchema,
  updateAccountSchema,
} from "../../validation/validation.schemas.js";

const router = express.Router();

// 🛡️ Rate limit + auth cho admin routes
router.use(adminLimiter);
router.use(adminProtect);

// read
router.get("/", getAccounts);
router.get("/:id", getAccountById);

// write
router.post("/", requireRole("super_admin", "admin"), validate(createAccountSchema), createAccount);
router.put("/:id", requireRole("super_admin", "admin"), validate(updateAccountSchema), updateAccount);
router.patch("/:id/status", requireRole("super_admin", "admin"), toggleAccountStatus);

// delete
router.delete("/:id", requireRole("super_admin", "admin"), deleteAccount);

export default router;