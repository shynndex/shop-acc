import express from "express";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  adminListReviews,
  moderateReview,
  adminReviewStats,
} from "../../controllers/review.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { moderateReviewSchema } from "../../validation/validation.schemas.js";

const router = express.Router();

router.use(adminLimiter);
router.use(adminProtect);

router.get("/", adminListReviews);
router.patch("/:id/status", validate(moderateReviewSchema), moderateReview);
router.get("/stats", adminReviewStats);

export default router;
