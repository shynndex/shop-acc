import express from "express";
import { protectedRoute } from "../middlewares/client/auth.middleware.js";
import {
  calculateFee,
  cardWebhook,
  createDepositInfo,
  payosWebhook,
  submitCardDeposit,
  createPayOSPurchase,
  checkPayOSPurchaseStatus,
  cancelPayOSPurchase,
} from "../controllers/payment.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createPayOSPurchaseSchema,
  createDepositInfoSchema,
  submitCardDepositSchema,
} from "../validation/validation.schemas.js";
import { strictLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

// Webhooks - public (không cần auth) — raw body is set by global middleware in server.js
// IMPORTANT: express.raw() is applied at app level BEFORE express.json() to preserve raw body for signature verification
router.post("/payos/webhook", payosWebhook);
router.post("/card/webhook", cardWebhook);

// Protected - user cần đăng nhập
router.post("/create-payment/bank", protectedRoute, strictLimiter, validate(createDepositInfoSchema), createDepositInfo);
router.post("/create-payment/card", protectedRoute, strictLimiter, validate(submitCardDepositSchema), submitCardDeposit);
router.post("/create-purchase", protectedRoute, strictLimiter, validate(createPayOSPurchaseSchema), createPayOSPurchase);
router.post("/purchase/:bankDepositId/check", protectedRoute, strictLimiter, checkPayOSPurchaseStatus);
router.post("/purchase/:bankDepositId/cancel", protectedRoute, strictLimiter, cancelPayOSPurchase);
router.get("/calculate-fee", protectedRoute, calculateFee);

export default router;
