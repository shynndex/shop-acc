import express from "express";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  getGeneralConfig,
  updateGeneralConfig,
  getCardProviderConfig,
} from "../../controllers/admin/config.controller.js";

const router = express.Router();

router.use(adminLimiter);
router.use(adminProtect);

router.get("/general", getGeneralConfig);
router.post("/general", updateGeneralConfig);
router.get("/card-providers", getCardProviderConfig);

export default router;
