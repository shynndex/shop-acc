import express from "express";
import { protectedRoute } from "../middlewares/client/auth.middleware.js";
import {
  getOrderById,
  getUserOrders,
  purchaseAccount,
  cancelPendingOrder,
} from "../controllers/order.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { purchaseAccountSchema } from "../validation/validation.schemas.js";
import { strictLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.use(protectedRoute);

router.post("/:accountId/purchase", strictLimiter, validate(purchaseAccountSchema), purchaseAccount);
router.get("/", getUserOrders);
router.get("/:id", getOrderById);
router.post("/:id/cancel", strictLimiter, cancelPendingOrder);

export default router;