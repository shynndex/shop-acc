import express from "express";
import {
  adminProtect,
  requireRole,
} from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  listAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus,
} from "../../controllers/admin/admin.controller.js";

const router = express.Router();

router.use(adminLimiter);
router.use(adminProtect);

// All routes require super_admin role
router.get("/", listAdmins);
router.get("/:id", getAdmin);
router.post("/", requireRole("super_admin"), createAdmin);
router.put("/:id", requireRole("super_admin"), updateAdmin);
router.patch("/:id/toggle-status", requireRole("super_admin"), toggleAdminStatus);
router.delete("/:id", requireRole("super_admin"), deleteAdmin);

export default router;
