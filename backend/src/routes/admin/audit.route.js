import express from "express";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import { getAuditLogs, exportAuditLogsCsv } from "../../controllers/admin/audit.controller.js";

const router = express.Router();

// 🛡️ Rate limit + auth cho admin routes
router.use(adminLimiter);
router.use(adminProtect);

// read
router.get("/", getAuditLogs);
router.get("/export", exportAuditLogsCsv);

export default router;
