import express from "express";
import {
  createDepositInfo,
  payosWebhook,
} from "../controllers/deposit.controller.js";

const router = express.Router();

router.post("/create-payment", createDepositInfo);

// Cần dùng express.raw() nếu PayOS gửi raw JSON để verify signature chính xác.
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  payosWebhook,
);

export default router;
