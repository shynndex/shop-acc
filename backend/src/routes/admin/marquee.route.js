import express from "express";
import { adminProtect } from "../../middlewares/admin/auth.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";
import { pushManualMarquee } from "../../controllers/admin/marquee.controller.js";

const router = express.Router();

router.use(adminLimiter);
router.use(adminProtect);

router.post("/", pushManualMarquee);

export default router;
