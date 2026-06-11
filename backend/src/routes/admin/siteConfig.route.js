import express from "express";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  getSiteConfig,
  updateSiteConfig,
} from "../../controllers/admin/siteConfig.controller.js";

const router = express.Router();

router.use(adminLimiter);
router.use(adminProtect);

router.get("/", getSiteConfig);
router.put("/", updateSiteConfig);

export default router;
