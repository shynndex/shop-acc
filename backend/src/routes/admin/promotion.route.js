import express from "express";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  listPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotion,
} from "../../controllers/admin/promotion.controller.js";

const router = express.Router();

router.use(adminLimiter);
router.use(adminProtect);

router.get("/", listPromotions);
router.get("/:id", getPromotion);
router.post("/", createPromotion);
router.put("/:id", updatePromotion);
router.patch("/:id/toggle", togglePromotion);
router.delete("/:id", deletePromotion);

export default router;
