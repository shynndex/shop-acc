import express from "express";
import { protectedRoute } from "../middlewares/client/auth.middleware.js";
import {
  createReview,
  updateReview,
  getPublicReviews,
  getUserReview,
} from "../controllers/review.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createReviewSchema,
  updateReviewSchema,
} from "../validation/validation.schemas.js";

const router = express.Router();

// Public
router.get("/", getPublicReviews);

// Protected
router.get("/my-review", protectedRoute, getUserReview);
router.post("/", protectedRoute, validate(createReviewSchema), createReview);
router.put("/:id", protectedRoute, validate(updateReviewSchema), updateReview);

export default router;
