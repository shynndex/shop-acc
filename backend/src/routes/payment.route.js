import express from "express";
import {
  calculateFee,
  cardWebhook,
  createDepositInfo,
  payosWebhook,
  submitCardDeposit,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-payment/bank", createDepositInfo);
router.post("/create-payment/card", submitCardDeposit);

// Cần dùng express.raw() nếu PayOS gửi raw JSON để verify signature chính xác.
router.post(
  "/payos/webhook",
  express.raw({ type: "application/json" }),
  payosWebhook,
);

router.post(
  "/card/webhook",
  express.raw({ type: "application/json" }),
  cardWebhook,
);

router.get("/calculate-fee", calculateFee);

export default router;
