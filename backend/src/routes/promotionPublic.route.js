import express from "express";
import { getActivePromotions } from "../controllers/admin/promotion.controller.js";

const router = express.Router();

router.get("/active", getActivePromotions);

export default router;
