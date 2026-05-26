import express from "express";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  listGiftcodes,
  createGiftcode,
  updateGiftcode,
  deleteGiftcode,
} from "../../controllers/giftcode.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createGiftcodeSchema,
  updateGiftcodeSchema,
} from "../../validation/validation.schemas.js";

const router = express.Router();

router.use(adminLimiter);
router.use(adminProtect);

router.get("/", listGiftcodes);
router.post("/", validate(createGiftcodeSchema), createGiftcode);
router.put("/:id", validate(updateGiftcodeSchema), updateGiftcode);
router.delete("/:id", deleteGiftcode);

export default router;
