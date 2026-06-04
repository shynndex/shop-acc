import express from "express";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  listOrders,
  getOrderById,
  getOrderStats,
  exportOrdersCsv,
} from "../../controllers/admin/order.controller.js";

const router = express.Router();

router.use(adminLimiter);
router.use(adminProtect);

router.get("/", listOrders);
router.get("/stats", getOrderStats);
router.get("/export", exportOrdersCsv);
router.get("/:id", getOrderById);

export default router;
