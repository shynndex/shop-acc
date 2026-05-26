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

const router = express.Router();

router.use(protectedRoute);

router.post("/:accountId/purchase", validate(purchaseAccountSchema), purchaseAccount);
router.get("/", getUserOrders);
router.get("/:id", getOrderById);
router.post("/:id/cancel", cancelPendingOrder);

export default router;