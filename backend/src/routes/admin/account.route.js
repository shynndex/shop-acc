import express from "express";
import {
  adminProtect,
  requireRole,
} from "../../middlewares/admin/auth.middleware.js";
import {
  createAccount,
  getAccountById,
  getAccounts,
  updateAccount,
  deleteAccount,
  toggleAccountStatus
} from "../../controllers/admin/account.controller.js";

const router = express.Router();

// Tất cả route đều cần admin login
router.use(adminProtect);

// read
router.get("/", getAccounts);
router.get("/:id", getAccountById);

// write
router.post("/", requireRole("super_admin", "admin"), createAccount);
router.put("/:id", requireRole("super_admin", "admin"), updateAccount);
router.patch("/:id/status", requireRole("super_admin", "admin"), toggleAccountStatus);

// delete
router.delete("/:id", requireRole("super_admin", "admin"), deleteAccount);

export default router