import express from "express";
import { validateGiftcode } from "../controllers/giftcode.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { validateGiftcodeSchema } from "../validation/validation.schemas.js";
import { strictLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

// POST /api/giftcodes/validate - Validate code (rate limited + validated)
router.post("/validate", strictLimiter, validate(validateGiftcodeSchema), validateGiftcode);

export default router;
